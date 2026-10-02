import { PrismaClient } from "@prisma/client";

const adminUserId = process.argv[2];
if (!adminUserId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(adminUserId)) {
  throw new Error("Usage: npm run db:seed -- <Supabase Auth user UUID>");
}

const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  throw new Error("DIRECT_URL is required to seed the local database.");
}

const databaseUrl = new URL(directUrl);
if (!["localhost", "127.0.0.1", "[::1]", "host.docker.internal"].includes(databaseUrl.hostname)) {
  throw new Error("Seed is restricted to a local database host.");
}

const prisma = new PrismaClient({
  datasources: {
    db: { url: directUrl },
  },
});

try {
  const [databaseRole] = await prisma.$queryRaw`
    SELECT rolsuper, rolbypassrls
    FROM pg_roles
    WHERE rolname = current_user
  `;
  if (!databaseRole?.rolsuper && !databaseRole?.rolbypassrls) {
    throw new Error("Local seed requires a database role that can bypass forced RLS.");
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: "suporte_ti" },
    update: {},
    create: { slug: "suporte_ti" },
  });

  await prisma.membership.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: adminUserId,
      },
    },
    update: { role: "ADMIN" },
    create: {
      tenantId: tenant.id,
      userId: adminUserId,
      role: "ADMIN",
    },
  });
} finally {
  await prisma.$disconnect();
}
