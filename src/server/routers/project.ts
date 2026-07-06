import { z } from 'zod';
import { eq } from 'drizzle-orm';

import { router, protectedProcedure } from '../trpc';
import { projects } from '@/lib/db/schema';

export const projectRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.projects.findMany({
      where: eq(projects.userId, ctx.session.user.id!),
      orderBy: (projects, { desc }) => [desc(projects.createdAt)],
    });
  }),

  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.query.projects.findFirst({
        where: eq(projects.slug, input.slug),
      });
    }),
});