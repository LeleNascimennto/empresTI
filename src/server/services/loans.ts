import "server-only";
import { EquipmentCondition, Prisma, PrismaClient } from "@prisma/client";
import { addBrazilianBusinessDays, pendingPickupExpiresAt } from "./loan-dates";

type TransactionClient = Prisma.TransactionClient;

export type LoanDomainErrorCode =
  | "EQUIPMENT_UNAVAILABLE"
  | "EQUIPMENT_MAINTENANCE"
  | "ACTIVE_LOAN_OVERDUE"
  | "ACTIVE_LIMIT_REACHED"
  | "PICKUP_EXPIRED"
  | "PICKUP_NOT_PENDING"
  | "LOAN_NOT_FOUND";

export class LoanDomainError extends Error {
  constructor(readonly code: LoanDomainErrorCode) {
    super(code);
    this.name = "LoanDomainError";
  }
}

type Actor = { tenantId: string; userId: string };

const closedLoanWhere = {
  returnedAt: null,
  cancelledAt: null,
  expiredAt: null,
} satisfies Prisma.LoanWhereInput;

function visibleOpenLoanWhere(now: Date): Prisma.LoanWhereInput {
  return {
    ...closedLoanWhere,
    OR: [
      { checkedOutAt: { not: null }, dueAt: { not: null } },
      { checkedOutAt: null, dueAt: null, expiresAt: { gt: now } },
    ],
  };
}

async function setRlsContext(tx: TransactionClient, actor: Actor) {
  await tx.$queryRaw`
    SELECT
      set_config('app.user_id', ${actor.userId}, true),
      set_config('app.tenant_id', ${actor.tenantId}, true)
  `;
}

async function expireStaleRequests(tx: TransactionClient, actor: Actor, now: Date, equipmentId?: string) {
  await tx.loan.updateMany({
    where: {
      tenantId: actor.tenantId,
      checkedOutAt: null,
      dueAt: null,
      returnedAt: null,
      cancelledAt: null,
      expiredAt: null,
      expiresAt: { lte: now },
      OR: [
        { borrowerUserId: actor.userId },
        ...(equipmentId ? [{ equipmentId }] : []),
      ],
    },
    data: { expiredAt: now },
  });
}

async function serializable<T>(
  db: PrismaClient,
  actor: Actor,
  operation: (tx: TransactionClient) => Promise<T>,
) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await db.$transaction(async (tx) => {
        await setRlsContext(tx, actor);
        return operation(tx);
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && attempt < 3) {
        continue;
      }
      throw error;
    }
  }
  throw new Error("Não foi possível concluir a solicitação concorrente.");
}

export async function listCatalog(db: PrismaClient, actor: Actor, now = new Date()) {
  return db.$transaction(async (tx) => {
    await setRlsContext(tx, actor);
    const equipment = await tx.equipment.findMany({
      where: { tenantId: actor.tenantId },
      orderBy: [{ category: "asc" }, { assetTag: "asc" }],
      include: {
        loans: {
          where: {
            ...visibleOpenLoanWhere(now),
          },
          select: { id: true, borrowerUserId: true, checkedOutAt: true, expiresAt: true },
          take: 1,
        },
      },
    });

    const ownLoans = await tx.loan.findMany({
      where: { tenantId: actor.tenantId, borrowerUserId: actor.userId, ...visibleOpenLoanWhere(now) },
      select: { id: true, checkedOutAt: true, dueAt: true, expiresAt: true },
    });
    const hasOverdueLoan = ownLoans.some((loan) => loan.checkedOutAt && loan.dueAt && loan.dueAt < now);
    const activeCount = ownLoans.length;

    return equipment.map(({ loans, ...item }) => {
      const openLoan = loans[0];
      const pending = Boolean(openLoan && !openLoan.checkedOutAt);
      const status = item.conditionStatus === EquipmentCondition.MAINTENANCE
        ? "MAINTENANCE"
        : pending
          ? "PENDING_PICKUP"
          : openLoan
            ? "BORROWED"
            : "AVAILABLE";
      return {
        ...item,
        status,
        pickupExpiresAt: pending ? openLoan?.expiresAt : null,
        canRequest: status === "AVAILABLE" && activeCount < 5 && !hasOverdueLoan,
        activeCount,
        hasOverdueLoan,
      };
    });
  });
}

export async function listMyLoans(db: PrismaClient, actor: Actor, now = new Date()) {
  return db.$transaction(async (tx) => {
    await setRlsContext(tx, actor);
    const loans = await tx.loan.findMany({
      where: {
        tenantId: actor.tenantId,
        borrowerUserId: actor.userId,
        ...visibleOpenLoanWhere(now),
      },
      orderBy: [{ checkedOutAt: "asc" }, { createdAt: "desc" }],
      include: {
        equipment: {
          select: {
            id: true,
            assetTag: true,
            name: true,
            category: true,
            imageUrl: true,
          },
        },
      },
    });
    const items = loans.map((loan) => {
      const duration = loan.checkedOutAt && loan.dueAt
        ? loan.dueAt.getTime() - loan.checkedOutAt.getTime()
        : 0;
      const elapsed = loan.checkedOutAt ? now.getTime() - loan.checkedOutAt.getTime() : 0;
      return {
        ...loan,
        isOverdue: Boolean(loan.dueAt && loan.dueAt < now),
        progressPercent: duration > 0 ? Math.min(100, Math.max(0, (elapsed / duration) * 100)) : 0,
      };
    });
    return {
      items,
      activeCount: loans.length,
      hasOverdueLoan: loans.some((loan) => loan.checkedOutAt && loan.dueAt && loan.dueAt < now),
    };
  });
}

export async function requestLoan(db: PrismaClient, actor: Actor, equipmentId: string, now = new Date()) {
  try {
    return await serializable(db, actor, async (tx) => {
      await expireStaleRequests(tx, actor, now, equipmentId);

      const equipment = await tx.equipment.findFirst({
        where: { id: equipmentId, tenantId: actor.tenantId },
        select: { id: true, conditionStatus: true },
      });
      if (!equipment) throw new LoanDomainError("EQUIPMENT_UNAVAILABLE");
      if (equipment.conditionStatus === EquipmentCondition.MAINTENANCE) {
        throw new LoanDomainError("EQUIPMENT_MAINTENANCE");
      }

      const occupied = await tx.loan.findFirst({
        where: { tenantId: actor.tenantId, equipmentId, ...closedLoanWhere },
        select: { id: true },
      });
      if (occupied) throw new LoanDomainError("EQUIPMENT_UNAVAILABLE");

      const overdue = await tx.loan.findFirst({
        where: {
          tenantId: actor.tenantId,
          borrowerUserId: actor.userId,
          ...closedLoanWhere,
          checkedOutAt: { not: null },
          dueAt: { lt: now },
        },
        select: { id: true },
      });
      if (overdue) throw new LoanDomainError("ACTIVE_LOAN_OVERDUE");

      const openCount = await tx.loan.count({
        where: {
          tenantId: actor.tenantId,
          borrowerUserId: actor.userId,
          ...closedLoanWhere,
          OR: [
            { checkedOutAt: { not: null }, dueAt: { not: null } },
            { checkedOutAt: null, dueAt: null, expiresAt: { gt: now } },
          ],
        },
      });
      if (openCount >= 5) throw new LoanDomainError("ACTIVE_LIMIT_REACHED");

      return tx.loan.create({
        data: {
          tenantId: actor.tenantId,
          equipmentId,
          borrowerUserId: actor.userId,
          createdAt: now,
          expiresAt: pendingPickupExpiresAt(now),
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new LoanDomainError("EQUIPMENT_UNAVAILABLE");
    }
    throw error;
  }
}

type PendingActionResult = "UPDATED" | "EXPIRED";

export async function confirmPickup(db: PrismaClient, actor: Actor, loanId: string, now = new Date()) {
  const result: PendingActionResult = await serializable(db, actor, async (tx) => {
    await expireStaleRequests(tx, actor, now);
    const loan = await tx.loan.findFirst({
      where: { id: loanId, tenantId: actor.tenantId, borrowerUserId: actor.userId },
    });
    if (!loan) throw new LoanDomainError("LOAN_NOT_FOUND");
    if (loan.expiredAt || (loan.expiresAt && loan.expiresAt <= now)) {
      if (!loan.expiredAt) await tx.loan.update({ where: { id: loan.id }, data: { expiredAt: now } });
      return "EXPIRED";
    }
    if (loan.checkedOutAt || loan.dueAt || loan.returnedAt || loan.cancelledAt || loan.expiredAt || !loan.expiresAt) {
      throw new LoanDomainError("PICKUP_NOT_PENDING");
    }
    await tx.loan.update({
      where: { id: loan.id },
      data: { checkedOutAt: now, dueAt: addBrazilianBusinessDays(now, 14) },
    });
    return "UPDATED";
  });
  if (result === "EXPIRED") throw new LoanDomainError("PICKUP_EXPIRED");
}

export async function cancelPendingLoan(db: PrismaClient, actor: Actor, loanId: string, now = new Date()) {
  const result: PendingActionResult = await serializable(db, actor, async (tx) => {
    await expireStaleRequests(tx, actor, now);
    const loan = await tx.loan.findFirst({
      where: { id: loanId, tenantId: actor.tenantId, borrowerUserId: actor.userId },
    });
    if (!loan) throw new LoanDomainError("LOAN_NOT_FOUND");
    if (loan.expiredAt || (loan.expiresAt && loan.expiresAt <= now)) {
      if (!loan.expiredAt) await tx.loan.update({ where: { id: loan.id }, data: { expiredAt: now } });
      return "EXPIRED";
    }
    if (loan.checkedOutAt || loan.dueAt || loan.returnedAt || loan.cancelledAt || loan.expiredAt || !loan.expiresAt) {
      throw new LoanDomainError("PICKUP_NOT_PENDING");
    }
    await tx.loan.update({ where: { id: loan.id }, data: { cancelledAt: now } });
    return "UPDATED";
  });
  if (result === "EXPIRED") throw new LoanDomainError("PICKUP_EXPIRED");
}
