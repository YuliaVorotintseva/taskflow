import { z } from "zod";
import { eq, and, asc, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { router, protectedProcedure } from "../trpc";
import { columns, projects, issues } from "@/lib/db/schema";

const createColumnSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(50),
});

const updateColumnSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50).optional(),
});

const reorderColumnsSchema = z.object({
  projectId: z.string().uuid(),
  orderedColumnIds: z.array(z.string().uuid()),
});

export const columnRouter = router({
  getByProject: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const project = await ctx.db.query.projects.findFirst({
        where: and(
          eq(projects.id, input.projectId),
          eq(projects.userId, ctx.session.user.id!),
        ),
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      return ctx.db.query.columns.findMany({
        where: eq(columns.projectId, input.projectId),
        orderBy: [asc(columns.position)],
        with: {
          issues: {
            orderBy: [asc(issues.position)],
          },
        },
      });
    }),

  create: protectedProcedure
    .input(createColumnSchema)
    .mutation(async ({ input, ctx }) => {
      const project = await ctx.db.query.projects.findFirst({
        where: and(
          eq(projects.id, input.projectId),
          eq(projects.userId, ctx.session.user.id!),
        ),
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      const lastColumn = await ctx.db.query.columns.findFirst({
        where: eq(columns.projectId, input.projectId),
        orderBy: [desc(columns.position)],
      });

      const newPosition = lastColumn ? lastColumn.position + 1 : 0;

      const [column] = await ctx.db
        .insert(columns)
        .values({
          projectId: input.projectId,
          name: input.name,
          position: newPosition,
        })
        .returning();

      return column;
    }),

  update: protectedProcedure
    .input(updateColumnSchema)
    .mutation(async ({ input, ctx }) => {
      const existingColumn = await ctx.db.query.columns.findFirst({
        where: eq(columns.id, input.id),
        with: { project: true },
      });

      if (!existingColumn) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Column not found",
        });
      }

      if (existingColumn.project.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No access",
        });
      }

      const updateData: { name?: string } = {};
      if (input.name !== undefined) updateData.name = input.name;

      if (Object.keys(updateData).length === 0) {
        return existingColumn;
      }

      const [updated] = await ctx.db
        .update(columns)
        .set(updateData)
        .where(eq(columns.id, input.id))
        .returning();

      return updated;
    }),

  reorder: protectedProcedure
    .input(reorderColumnsSchema)
    .mutation(async ({ input, ctx }) => {
      const project = await ctx.db.query.projects.findFirst({
        where: and(
          eq(projects.id, input.projectId),
          eq(projects.userId, ctx.session.user.id!),
        ),
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      const updatePromises = input.orderedColumnIds.map((columnId, index) =>
        ctx.db
          .update(columns)
          .set({ position: index })
          .where(eq(columns.id, columnId)),
      );

      await Promise.all(updatePromises);

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const existingColumn = await ctx.db.query.columns.findFirst({
        where: eq(columns.id, input.id),
        with: { project: true },
      });

      if (!existingColumn) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Column not found",
        });
      }

      if (existingColumn.project.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No access",
        });
      }

      await ctx.db.delete(columns).where(eq(columns.id, input.id));

      return { success: true };
    }),
});
