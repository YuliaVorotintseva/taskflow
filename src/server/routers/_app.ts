import { router } from '../trpc';
import { issueRouter } from './issue';
import { projectRouter } from './project';

export const appRouter = router({
  issue: issueRouter,
  project: projectRouter,
});

export type AppRouter = typeof appRouter;