import { z } from 'zod';
import { eq, and, asc, desc, inArray } from 'drizzle-orm';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

import { 
  issues,
  columns,
  projects
} from '@/lib/db/schema';

const prioritySchema = z.enum(['low', 'medium', 'high']);

const issueMetadataSchema = z.object({
  estimate: z.number().int().min(0).max(100).optional(),
  priority: prioritySchema.optional(),
  dueDate: z.string().optional(),
  labels: z.array(z.string()).optional(),
});

const createIssueSchema = z.object({
  projectId: z.string().uuid(),
  columnId: z.string().uuid(),
  title: z.string().min(1, 'Название обязательно').max(200),
  description: z.string().max(5000).optional(),
  metadata: issueMetadataSchema.optional(),
  assigneeId: z.string().optional(),
});

const updateIssueSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  metadata: issueMetadataSchema.optional(),
  assigneeId: z.string().optional().nullable(),
});

const moveIssueSchema = z.object({
  id: z.string().uuid(),
  newColumnId: z.string().uuid(),
  newPosition: z.number().int().min(0),
});

const reorderIssuesSchema = z.object({
  columnId: z.string().uuid(),
  orderedIssueIds: z.array(z.string().uuid()),
});

const filterSchema = z.object({
  assigneeId: z.string().uuid().optional(),
  priority: prioritySchema.optional(),
  search: z.string().optional(),
});

const getBoardSchema = z.object({
  projectId: z.string().uuid(),
  filters: filterSchema.optional(),
});

async function verifyProjectAccess(
  db: any,
  projectId: string,
  userId: string
) {
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.userId, userId)
    ),
  });

  if (!project) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Проект не найден или у вас нет доступа',
    });
  }

  return project;
}

export const issueRouter = router({
  getBoardData: protectedProcedure
    .input(getBoardSchema)
    .query(async ({ input, ctx }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.session.user.id!);

      const projectColumns = await ctx.db.query.columns.findMany({
        where: eq(columns.projectId, input.projectId),
        orderBy: [asc(columns.position)],
      });

      if (projectColumns.length === 0) {
        return { columns: [] };
      }

      const columnIds = projectColumns.map(c => c.id);

      const conditions = [
        inArray(issues.columnId, columnIds),
        eq(issues.projectId, input.projectId),
      ];

      if (input.filters?.assigneeId) {
        conditions.push(eq(issues.assigneeId, input.filters.assigneeId));
      }

      if (input.filters?.priority) {
        const { sql } = await import('drizzle-orm');
        conditions.push(
          sql`${issues.metadata}->>'priority' = ${input.filters.priority}`
        );
      }

      if (input.filters?.search) {
        const { sql } = await import('drizzle-orm');
        const searchTerm = `%${input.filters.search}%`;
        conditions.push(
          sql`(${issues.title} ILIKE ${searchTerm} OR ${issues.description} ILIKE ${searchTerm})`
        );
      }

      const allIssues = await ctx.db.query.issues.findMany({
        where: and(...conditions),
        with: {
          assignee: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: [asc(issues.position)],
      });

      const issuesByColumn = allIssues.reduce((acc, issue) => {
        if (!acc[issue.columnId]) {
          acc[issue.columnId] = [];
        }
        acc[issue.columnId].push(issue);
        return acc;
      }, {} as Record<string, typeof allIssues>);

      const columnsWithIssues = projectColumns.map(column => ({
        ...column,
        issues: issuesByColumn[column.id] || [],
      }));

      return { columns: columnsWithIssues };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const issue = await ctx.db.query.issues.findFirst({
        where: eq(issues.id, input.id),
        with: {
          project: {
            columns: {
              id: true,
              slug: true,
              name: true,
            },
          },
          column: true,
          assignee: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      if (!issue) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Задача не найдена',
        });
      }

      await verifyProjectAccess(ctx.db, issue.projectId, ctx.session.user.id!);

      return issue;
    }),

  create: protectedProcedure
    .input(createIssueSchema)
    .mutation(async ({ input, ctx }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.session.user.id!);

      const column = await ctx.db.query.columns.findFirst({
        where: and(
          eq(columns.id, input.columnId),
          eq(columns.projectId, input.projectId)
        ),
      });

      if (!column) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Колонка не найдена в этом проекте',
        });
      }

      const lastIssue = await ctx.db.query.issues.findFirst({
        where: eq(issues.columnId, input.columnId),
        orderBy: [desc(issues.position)],
      });

      const newPosition = lastIssue ? lastIssue.position + 1 : 0;

      const [newIssue] = await ctx.db.insert(issues).values({
        projectId: input.projectId,
        columnId: input.columnId,
        title: input.title,
        description: input.description || null,
        metadata: input.metadata || {},
        assigneeId: input.assigneeId || null,
        position: newPosition,
      }).returning();

      return newIssue;
    }),

  update: protectedProcedure
    .input(updateIssueSchema)
    .mutation(async ({ input, ctx }) => {
      const existingIssue = await ctx.db.query.issues.findFirst({
        where: eq(issues.id, input.id),
      });

      if (!existingIssue) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Задача не найдена',
        });
      }

      await verifyProjectAccess(ctx.db, existingIssue.projectId, ctx.session.user.id!);

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.metadata !== undefined) updateData.metadata = input.metadata;
      if (input.assigneeId !== undefined) updateData.assigneeId = input.assigneeId;

      const [updatedIssue] = await ctx.db
        .update(issues)
        .set(updateData)
        .where(eq(issues.id, input.id))
        .returning();

      return updatedIssue;
    }),

  move: protectedProcedure
    .input(moveIssueSchema)
    .mutation(async ({ input, ctx }) => {
      const existingIssue = await ctx.db.query.issues.findFirst({
        where: eq(issues.id, input.id),
      });

      if (!existingIssue) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Задача не найдена',
        });
      }

      await verifyProjectAccess(ctx.db, existingIssue.projectId, ctx.session.user.id!);

      const newColumn = await ctx.db.query.columns.findFirst({
        where: and(
          eq(columns.id, input.newColumnId),
          eq(columns.projectId, existingIssue.projectId)
        ),
      });

      if (!newColumn) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Целевая колонка не найдена',
        });
      }

      if (existingIssue.columnId === input.newColumnId) {
        const columnIssues = await ctx.db.query.issues.findMany({
          where: eq(issues.columnId, input.newColumnId),
          orderBy: [asc(issues.position)],
        });

        const otherIssues = columnIssues.filter(i => i.id !== input.id);

        const newOrder = [
          ...otherIssues.slice(0, input.newPosition),
          existingIssue,
          ...otherIssues.slice(input.newPosition),
        ];

        const updatePromises = newOrder.map((issue, index) =>
          ctx.db
            .update(issues)
            .set({ position: index })
            .where(eq(issues.id, issue.id))
        );

        await Promise.all(updatePromises);
      } else {
        const targetColumnIssues = await ctx.db.query.issues.findMany({
          where: eq(issues.columnId, input.newColumnId),
          orderBy: [asc(issues.position)],
        });

        const newOrder = [
          ...targetColumnIssues.slice(0, input.newPosition),
          existingIssue,
          ...targetColumnIssues.slice(input.newPosition),
        ];

        await ctx.db
          .update(issues)
          .set({ 
            columnId: input.newColumnId,
            position: input.newPosition,
            updatedAt: new Date(),
          })
          .where(eq(issues.id, input.id));

        const updatePromises = newOrder
          .filter(i => i.id !== input.id)
          .map((issue, index) => {
            const actualPosition = index < input.newPosition ? index : index + 1;
            return ctx.db
              .update(issues)
              .set({ position: actualPosition })
              .where(eq(issues.id, issue.id));
          });

        await Promise.all(updatePromises);

        if (existingIssue.columnId !== input.newColumnId) {
          const sourceColumnIssues = await ctx.db.query.issues.findMany({
            where: eq(issues.columnId, existingIssue.columnId),
            orderBy: [asc(issues.position)],
          });

          const reindexPromises = sourceColumnIssues.map((issue, index) =>
            ctx.db
              .update(issues)
              .set({ position: index })
              .where(eq(issues.id, issue.id))
          );

          await Promise.all(reindexPromises);
        }
      }

      return { success: true };
    }),

  reorder: protectedProcedure
    .input(reorderIssuesSchema)
    .mutation(async ({ input, ctx }) => {
      const column = await ctx.db.query.columns.findFirst({
        where: eq(columns.id, input.columnId),
      });

      if (!column) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Колонка не найдена',
        });
      }

      await verifyProjectAccess(ctx.db, column.projectId, ctx.session.user.id!);

      const updatePromises = input.orderedIssueIds.map((issueId, index) =>
        ctx.db
          .update(issues)
          .set({ position: index })
          .where(eq(issues.id, issueId))
      );

      await Promise.all(updatePromises);

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const existingIssue = await ctx.db.query.issues.findFirst({
        where: eq(issues.id, input.id),
      });

      if (!existingIssue) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Задача не найдена',
        });
      }

      await verifyProjectAccess(ctx.db, existingIssue.projectId, ctx.session.user.id!);

      await ctx.db
        .delete(issues)
        .where(eq(issues.id, input.id));

      const columnIssues = await ctx.db.query.issues.findMany({
        where: eq(issues.columnId, existingIssue.columnId),
        orderBy: [asc(issues.position)],
      });

      const reindexPromises = columnIssues.map((issue, index) =>
        ctx.db
          .update(issues)
          .set({ position: index })
          .where(eq(issues.id, issue.id))
      );

      await Promise.all(reindexPromises);

      return { success: true };
    }),

  listByProject: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      filters: filterSchema.optional(),
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.session.user.id!);

      const conditions = [eq(issues.projectId, input.projectId)];

      if (input.filters?.assigneeId) {
        conditions.push(eq(issues.assigneeId, input.filters.assigneeId));
      }

      if (input.filters?.priority) {
        const { sql } = await import('drizzle-orm');
        conditions.push(
          sql`${issues.metadata}->>'priority' = ${input.filters.priority}`
        );
      }

      if (input.filters?.search) {
        const { sql } = await import('drizzle-orm');
        const searchTerm = `%${input.filters.search}%`;
        conditions.push(
          sql`(${issues.title} ILIKE ${searchTerm} OR ${issues.description} ILIKE ${searchTerm})`
        );
      }

      const result = await ctx.db.query.issues.findMany({
        where: and(...conditions),
        with: {
          column: true,
          assignee: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: [desc(issues.createdAt)],
        limit: input.limit,
        offset: input.offset,
      });

      return result;
    }),
});