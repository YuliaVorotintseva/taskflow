import { router } from "../trpc";
import { activityRouter } from "./activity";
import { columnRouter } from "./column";
import { commentRouter } from "./comment";
import { issueRouter } from "./issue";
import { memberRouter } from "./member";
import { notificationRouter } from "./notification";
import { projectRouter } from "./project";
import { searchRouter } from "./search";

export const appRouter = router({
  issue: issueRouter,
  project: projectRouter,
  column: columnRouter,
  activity: activityRouter,
  member: memberRouter,
  comment: commentRouter,
  notification: notificationRouter,
  search: searchRouter,
});

export type AppRouter = typeof appRouter;
