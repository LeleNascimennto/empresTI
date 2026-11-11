// @vitest-environment node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { MembershipRole, PrismaClient } from "@prisma/client";
import { appRouter } from "../api/root";
import {
  cancelPendingLoan,
  confirmPickup,
  listCatalog,
  listMyLoans,
  LoanDomainError,
  requestLoan,
} from "./loans";
import { addBrazilianBusinessDays } from "./loan-dates";

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
let sequence = 1;

function uuid(index: number) {
  return "10000000-0000-4000-8000-" + String(index).padStart(12, "0");
}

async function setupTenant(label: string, users = 1) {
  const id = sequence++;
  const tenantId = uuid(id);
  await prisma.tenant.create({ data: { id: tenantId, slug: "loan-test-" + label + "-" + id } });
  const userIds = Array.from({ length: users }, (_, index) => uuid(100 + id * 10 + index));
  await prisma.membership.createMany({
    data: userIds.map((userId) => ({ tenantId, userId, role: "COLLABORATOR" as const })),
  });
  return { tenantId, userIds };
}

async function addEquipment(tenantId: string, count: number) {
  return Promise.all(Array.from({ length: count }, (_, index) => prisma.equipment.create({
    data: {
      tenantId,
      assetTag: "IT-" + sequence + "-" + (index + 1),
      name: "Equipamento " + (index + 1),
      category: "notebook",
    },
  })));
}

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("empresti_test")
    .withUsername("postgres")
    .withPassword("postgres")
    .start();
  const connectionUrl = container.getConnectionUri();
  execFileSync(process.execPath, [path.resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: connectionUrl, DIRECT_URL: connectionUrl },
    stdio: "pipe",
  });
  prisma = new PrismaClient({ datasources: { db: { url: connectionUrl } } });
}, 120_000);

afterAll(async () => {
  await prisma?.$disconnect();
  await container?.stop();
}, 30_000);

describe("loan service with real PostgreSQL", () => {
  it("creates a pending request, confirms pickup and sets 14 business days", async () => {
    const { tenantId, userIds: [userId] } = await setupTenant("confirm");
    const [equipment] = await addEquipment(tenantId, 1);
    const actor = { tenantId, userId };
    const now = new Date("2026-11-19T15:30:00-03:00");
    const pending = await requestLoan(prisma, actor, equipment.id, now);
    expect(pending.checkedOutAt).toBeNull();
    expect((await listCatalog(prisma, actor, now))[0].status).toBe("PENDING_PICKUP");
    await confirmPickup(prisma, actor, pending.id, now);
    const loans = await listMyLoans(prisma, actor, now);
    expect(loans.items[0].checkedOutAt?.toISOString()).toBe(now.toISOString());
    expect(loans.items[0].dueAt?.toISOString()).toBe(addBrazilianBusinessDays(now, 14).toISOString());
  });

  it("cancels only before pickup and releases the equipment", async () => {
    const { tenantId, userIds: [userId] } = await setupTenant("cancel");
    const [equipment] = await addEquipment(tenantId, 1);
    const actor = { tenantId, userId };
    const now = new Date("2026-11-16T15:30:00-03:00");
    const pending = await requestLoan(prisma, actor, equipment.id, now);
    await cancelPendingLoan(prisma, actor, pending.id, now);
    expect((await listCatalog(prisma, actor, now))[0].status).toBe("AVAILABLE");
    await expect(confirmPickup(prisma, actor, pending.id, now)).rejects.toMatchObject({ code: "PICKUP_NOT_PENDING" });
  });

  it("counts pending requests toward the five-item limit and blocks an overdue borrower", async () => {
    const { tenantId, userIds: [userId] } = await setupTenant("limit");
    const [one, two, three, four, five, six] = await addEquipment(tenantId, 6);
    const actor = { tenantId, userId };
    const now = new Date("2026-11-16T15:30:00-03:00");
    for (const equipment of [one, two, three, four, five]) await requestLoan(prisma, actor, equipment.id, now);
    await expect(requestLoan(prisma, actor, six.id, now)).rejects.toMatchObject({ code: "ACTIVE_LIMIT_REACHED" });

    const other = await setupTenant("overdue");
    const [overdueEquipment, availableEquipment] = await addEquipment(other.tenantId, 2);
    const yesterday = new Date(now.getTime() - 86_400_000);
    await prisma.loan.create({
      data: {
        tenantId: other.tenantId,
        equipmentId: overdueEquipment.id,
        borrowerUserId: other.userIds[0],
        checkedOutAt: new Date(now.getTime() - 10 * 86_400_000),
        dueAt: yesterday,
      },
    });
    await expect(requestLoan(prisma, { tenantId: other.tenantId, userId: other.userIds[0] }, availableEquipment.id, now))
      .rejects.toMatchObject({ code: "ACTIVE_LOAN_OVERDUE" });
  });

  it("serializes concurrent requests at the five-item boundary", async () => {
    const { tenantId, userIds: [userId] } = await setupTenant("limit-race");
    const equipment = await addEquipment(tenantId, 6);
    const actor = { tenantId, userId };
    const now = new Date("2026-11-16T15:30:00-03:00");
    for (const item of equipment.slice(0, 4)) await requestLoan(prisma, actor, item.id, now);

    const attempts = await Promise.allSettled([
      requestLoan(prisma, actor, equipment[4].id, now),
      requestLoan(prisma, actor, equipment[5].id, now),
    ]);
    expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1);
    const rejected = attempts.find((attempt) => attempt.status === "rejected");
    expect(rejected?.status === "rejected" && rejected.reason).toMatchObject({ code: "ACTIVE_LIMIT_REACHED" });
  });

  it("keeps tenant data isolated and resolves concurrent claims to one request", async () => {
    const { tenantId, userIds } = await setupTenant("race", 2);
    const [equipment] = await addEquipment(tenantId, 1);
    const otherTenant = await setupTenant("isolated");
    const [otherEquipment] = await addEquipment(otherTenant.tenantId, 1);
    const actor = { tenantId, userId: userIds[0] };
    const visible = await listCatalog(prisma, actor);
    expect(visible.map((item) => item.id)).toContain(equipment.id);
    expect(visible.some((item) => item.id === otherEquipment.id)).toBe(false);

    const attempts = await Promise.allSettled(userIds.map((userId) =>
      requestLoan(prisma, { tenantId, userId }, equipment.id),
    ));
    expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1);
    const rejected = attempts.find((attempt) => attempt.status === "rejected");
    expect(rejected?.status === "rejected" && rejected.reason).toBeInstanceOf(LoanDomainError);
  });

  it("enforces tenant scope through the tRPC caller", async () => {
    const { tenantId, userIds: [userId] } = await setupTenant("caller-a");
    const [ownEquipment] = await addEquipment(tenantId, 1);
    const otherTenant = await setupTenant("caller-b");
    const [foreignEquipment] = await addEquipment(otherTenant.tenantId, 1);
    const caller = appRouter.createCaller({
      db: prisma,
      tenantId,
      userId,
      role: MembershipRole.COLLABORATOR,
    });

    const catalog = await caller.equipment.listCatalog();
    expect(catalog.map((item) => item.id)).toContain(ownEquipment.id);
    expect(catalog.some((item) => item.id === foreignEquipment.id)).toBe(false);
    await expect(caller.loans.request({ equipmentId: foreignEquipment.id }))
      .rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("allows only the requesting collaborator to confirm or cancel a pending pickup", async () => {
    const { tenantId, userIds } = await setupTenant("ownership", 2);
    const [equipment] = await addEquipment(tenantId, 1);
    const owner = { tenantId, userId: userIds[0] };
    const other = { tenantId, userId: userIds[1] };
    const pending = await requestLoan(prisma, owner, equipment.id, new Date("2026-11-16T15:30:00-03:00"));

    await expect(confirmPickup(prisma, other, pending.id)).rejects.toMatchObject({ code: "LOAN_NOT_FOUND" });
    await expect(cancelPendingLoan(prisma, other, pending.id)).rejects.toMatchObject({ code: "LOAN_NOT_FOUND" });
    expect((await prisma.loan.findUniqueOrThrow({ where: { id: pending.id } })).checkedOutAt).toBeNull();
  });

  it("expires stale pickup requests transactionally before another user claims the item", async () => {
    const { tenantId, userIds } = await setupTenant("expiration", 2);
    const [equipment] = await addEquipment(tenantId, 1);
    const creator = { tenantId, userId: userIds[0] };
    const nextUser = { tenantId, userId: userIds[1] };
    const created = new Date("2026-11-13T17:00:00-03:00");
    const pending = await requestLoan(prisma, creator, equipment.id, created);
    const claimed = await requestLoan(prisma, nextUser, equipment.id, new Date("2026-11-16T17:00:00-03:00"));
    expect((await prisma.loan.findUniqueOrThrow({ where: { id: pending.id } })).expiredAt).not.toBeNull();
    expect(claimed.borrowerUserId).toBe(nextUser.userId);
  });
});
