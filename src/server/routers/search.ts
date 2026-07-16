import { z } from "zod";
import { eq, and, or, ilike, sql } from "drizzle-orm";

import { router, protectedProcedure } from "../trpc";
import { projects, issues, projectMembers } from "@/lib/db/schema";

export const searchRouter = router({
  global: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ input, ctx }) => {
      const searchTerm = `%${input.query}%`;

      const userProjects = await ctx.db.query.projects.findMany({
        where: eq(projects.userId, ctx.session.user.id!),
        columns: { id: true, slug: true },
      });

      const projectIds = userProjects.map((p) => p.id);

      const memberProjects = await ctx.db.query.projectMembers.findMany({
        where: eq(projectMembers.userId, ctx.session.user.id!),
        columns: { projectId: true },
      });

      const allProjectIds = [
        ...projectIds,
        ...memberProjects.map((m) => m.projectId),
      ];

      if (allProjectIds.length === 0) {
        return { projects: [], issues: [] };
      }

      const matchedProjects = await ctx.db.query.projects.findMany({
        where: and(
          sql`${projects.id} = ANY(${allProjectIds})`,
          or(
            ilike(projects.name, searchTerm),
            ilike(projects.description, searchTerm),
          ),
        ),
        limit: input.limit,
      });

      const matchedIssues = await ctx.db.query.issues.findMany({
        where: and(
          sql`${issues.projectId} = ANY(${allProjectIds})`,
          or(
            ilike(issues.title, searchTerm),
            ilike(issues.description, searchTerm),
          ),
        ),
        limit: input.limit,
        with: {
          project: {
            columns: { id: true, slug: true, name: true },
          },
        },
      });

      return {
        projects: matchedProjects,
        issues: matchedIssues,
      };
    }),
});
