import "server-only";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { getEnv } from "@/env";
import { prisma } from "@/server/db";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export async function createTRPCContext() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const subject = data?.claims?.sub;
  const userId = typeof subject === "string" ? subject : null;
  if (userId) {
    getEnv();
  }
  const memberships = userId
    ? await prisma.membership.findMany({
        where: { userId },
        select: { tenantId: true, role: true },
        take: 2,
      })
    : [];
  const membership = memberships.length === 1 ? memberships[0] : null;

  return {
    db: prisma,
    userId,
    tenantId: membership?.tenantId ?? null,
    role: membership?.role ?? null,
  };
}

const t = initTRPC.context<Awaited<ReturnType<typeof createTRPCContext>>>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

export const tenantProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.tenantId || !ctx.role) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "A sessão precisa ter exatamente um vínculo ativo com um tenant.",
    });
  }
  return next({ ctx: { ...ctx, tenantId: ctx.tenantId, role: ctx.role } });
});

export const adminProcedure = tenantProcedure.use(({ ctx, next }) => {
  if (ctx.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});
