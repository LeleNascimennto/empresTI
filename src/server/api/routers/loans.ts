import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, tenantProcedure } from "../trpc";
import {
  cancelPendingLoan,
  confirmPickup,
  listMyLoans,
  LoanDomainError,
  requestLoan,
} from "../../services/loans";

function mapLoanError(error: unknown): never {
  if (!(error instanceof LoanDomainError)) throw error;
  const messages = {
    EQUIPMENT_UNAVAILABLE: ["CONFLICT", "Este equipamento não está disponível para solicitação."],
    EQUIPMENT_MAINTENANCE: ["CONFLICT", "Este equipamento está em manutenção."],
    ACTIVE_LOAN_OVERDUE: ["PRECONDITION_FAILED", "Regularize o empréstimo em atraso antes de solicitar outro item."],
    ACTIVE_LIMIT_REACHED: ["PRECONDITION_FAILED", "Você já atingiu o limite de 5 itens entre pedidos e empréstimos ativos."],
    PICKUP_EXPIRED: ["PRECONDITION_FAILED", "O prazo para retirada terminou. O item foi liberado."],
    PICKUP_NOT_PENDING: ["CONFLICT", "Este pedido não está aguardando retirada."],
    LOAN_NOT_FOUND: ["NOT_FOUND", "Pedido não encontrado."],
  } as const;
  const [code, message] = messages[error.code];
  throw new TRPCError({ code, message });
}

export const loansRouter = router({
  mine: tenantProcedure.query(({ ctx }) =>
    listMyLoans(ctx.db, { tenantId: ctx.tenantId, userId: ctx.userId }),
  ),

  request: tenantProcedure
    .input(z.object({ equipmentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await requestLoan(ctx.db, { tenantId: ctx.tenantId, userId: ctx.userId }, input.equipmentId);
      } catch (error) {
        return mapLoanError(error);
      }
    }),

  confirmPickup: tenantProcedure
    .input(z.object({ loanId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await confirmPickup(ctx.db, { tenantId: ctx.tenantId, userId: ctx.userId }, input.loanId);
        return { success: true };
      } catch (error) {
        return mapLoanError(error);
      }
    }),

  cancelPending: tenantProcedure
    .input(z.object({ loanId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await cancelPendingLoan(ctx.db, { tenantId: ctx.tenantId, userId: ctx.userId }, input.loanId);
        return { success: true };
      } catch (error) {
        return mapLoanError(error);
      }
    }),
});
