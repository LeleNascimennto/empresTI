import { router } from "./trpc";
import { equipmentRouter } from "./routers/equipment";
import { loansRouter } from "./routers/loans";

export const appRouter = router({
  equipment: equipmentRouter,
  loans: loansRouter,
});
export type AppRouter = typeof appRouter;
