import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { router, protectedProcedure } from "../trpc";
import { projects, columns, issues } from "@/lib/db/schema";

const slugSchema = z
  .string()
  .min(3, "Минимум 3 символа")
  .max(50, "Максимум 50 символов")
  .regex(/^[a-z0-9-]+$/, "Только латинские буквы, цифры и дефис");

const createProjectSchema = z.object({
  name: z.string().min(1, "Название обязательно").max(100),
  slug: slugSchema,
  description: z.string().max(500).optional(),
});

const updateProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
});

export const projectRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({
        id: projects.id,
        userId: projects.userId,
        slug: projects.slug,
        name: projects.name,
        description: projects.description,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        columnsCount: sql<number>`
          (SELECT COUNT(*) FROM ${columns} WHERE ${columns.projectId} = ${projects.id})
        `.mapWith(Number),
        issuesCount: sql<number>`
          (SELECT COUNT(*) FROM ${issues} WHERE ${issues.projectId} = ${projects.id})
        `.mapWith(Number),
      })
      .from(projects)
      .where(eq(projects.userId, ctx.session.user.id!))
      .orderBy(desc(projects.createdAt));

    return result;
  }),

  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const project = await ctx.db.query.projects.findFirst({
        where: and(
          eq(projects.slug, input.slug),
          eq(projects.userId, ctx.session.user.id!),
        ),
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Проект не найден",
        });
      }

      return project;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const project = await ctx.db.query.projects.findFirst({
        where: and(
          eq(projects.id, input.id),
          eq(projects.userId, ctx.session.user.id!),
        ),
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Проект не найден",
        });
      }

      return project;
    }),

  create: protectedProcedure
    .input(createProjectSchema)
    .mutation(async ({ input, ctx }) => {
      const existingProject = await ctx.db.query.projects.findFirst({
        where: and(
          eq(projects.slug, input.slug),
          eq(projects.userId, ctx.session.user.id!),
        ),
      });

      if (existingProject) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Проект с таким URL уже существует",
        });
      }

      const [project] = await ctx.db
        .insert(projects)
        .values({
          userId: ctx.session.user.id!,
          name: input.name,
          slug: input.slug,
          description: input.description || null,
        })
        .returning();

      const defaultColumns = ["Backlog", "Todo", "In Progress", "Done"];
      const columnData = defaultColumns.map((name, index) => ({
        projectId: project.id,
        name,
        position: index,
      }));

      await ctx.db.insert(columns).values(columnData);

      return project;
    }),

  update: protectedProcedure
    .input(updateProjectSchema)
    .mutation(async ({ input, ctx }) => {
      const existingProject = await ctx.db.query.projects.findFirst({
        where: and(
          eq(projects.id, input.id),
          eq(projects.userId, ctx.session.user.id!),
        ),
      });

      if (!existingProject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Проект не найден",
        });
      }

      const updateData: {
        name?: string;
        description?: string | null;
        updatedAt: Date;
      } = { updatedAt: new Date() };
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined)
        updateData.description = input.description;

      const [updated] = await ctx.db
        .update(projects)
        .set(updateData)
        .where(eq(projects.id, input.id))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const existingProject = await ctx.db.query.projects.findFirst({
        where: and(
          eq(projects.id, input.id),
          eq(projects.userId, ctx.session.user.id!),
        ),
      });

      if (!existingProject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Проект не найден",
        });
      }

      await ctx.db.delete(projects).where(eq(projects.id, input.id));

      return { success: true };
    }),
});
