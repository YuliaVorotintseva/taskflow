import { router } from "../trpc";
import { activityRouter } from "./activity";
import { columnRouter } from "./column";
import { issueRouter } from "./issue";
import { projectRouter } from "./project";

export const appRouter = router({
  issue: issueRouter,
  project: projectRouter,
  column: columnRouter,
  activity: activityRouter,
});

export type AppRouter = typeof appRouter;
