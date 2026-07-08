import { router } from "../trpc";
import { columnRouter } from "./column";
import { issueRouter } from "./issue";
import { projectRouter } from "./project";

export const appRouter = router({
  issue: issueRouter,
  project: projectRouter,
  column: columnRouter,
});

export type AppRouter = typeof appRouter;
