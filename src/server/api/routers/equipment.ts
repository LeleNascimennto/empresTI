import { router, tenantProcedure } from "../trpc";
import { listCatalog } from "../../services/loans";

export const equipmentRouter = router({
  listCatalog: tenantProcedure.query(({ ctx }) =>
    listCatalog(ctx.db, { tenantId: ctx.tenantId, userId: ctx.userId }),
  ),
});
