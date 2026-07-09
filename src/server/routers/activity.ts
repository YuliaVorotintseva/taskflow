import { z } from "zod";
import { eq, desc } from "drizzle-orm";

import { router, protectedProcedure } from "../trpc";
import { activities } from "@/lib/db/schema";

export const activityRouter = router({
  getByProject: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.query.activities.findMany({
        where: eq(activities.projectId, input.projectId),
        orderBy: [desc(activities.createdAt)],
        limit: 50,
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });
    }),
});
