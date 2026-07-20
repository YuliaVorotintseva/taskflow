import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, isNull, inArray } from "drizzle-orm";

import { router, protectedProcedure } from "../trpc";
import {
  comments,
  issues,
  projectMembers,
  notifications,
} from "@/lib/db/schema";

const createCommentSchema = z.object({
  issueId: z.string().uuid(),
  content: z.string().min(1, "Content is required").max(5000),
  parentId: z.string().uuid().optional(),
});

const updateCommentSchema = z.object({
  commentId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

const deleteCommentSchema = z.object({
  commentId: z.string().uuid(),
});

export const commentRouter = router({
  getByIssue: protectedProcedure
    .input(z.object({ issueId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      try {
        const rootComments = await ctx.db.query.comments.findMany({
          where: and(
            eq(comments.issueId, input.issueId),
            isNull(comments.parentId),
          ),
          orderBy: [desc(comments.createdAt)],
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

        if (rootComments.length === 0) {
          return [];
        }

        const rootCommentIds = rootComments.map((c) => c.id);

        const replies = await ctx.db.query.comments.findMany({
          where: and(
            eq(comments.issueId, input.issueId),
            inArray(comments.parentId, rootCommentIds),
          ),
          orderBy: [comments.createdAt],
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

        const repliesByParent = replies.reduce(
          (acc, reply) => {
            const parentId = reply.parentId;
            if (parentId) {
              if (!acc[parentId]) acc[parentId] = [];
              acc[parentId].push(reply);
            }
            return acc;
          },
          {} as Record<string, typeof replies>,
        );

        return rootComments.map((comment) => ({
          ...comment,
          replies: repliesByParent[comment.id] || [],
        }));
      } catch (error) {
        console.error("Get comments error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load comments",
        });
      }
    }),

  create: protectedProcedure
    .input(createCommentSchema)
    .mutation(async ({ input, ctx }) => {
      const issue = await ctx.db.query.issues.findFirst({
        where: eq(issues.id, input.issueId),
        with: { project: true },
      });

      if (!issue) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Issue not found",
        });
      }

      const member = await ctx.db.query.projectMembers.findFirst({
        where: and(
          eq(projectMembers.projectId, issue.projectId),
          eq(projectMembers.userId, ctx.session.user.id!),
        ),
      });

      if (!member && issue.project.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this project",
        });
      }

      const [comment] = await ctx.db
        .insert(comments)
        .values({
          issueId: input.issueId,
          userId: ctx.session.user.id!,
          content: input.content,
          parentId: input.parentId ?? null,
        })
        .returning();

      if (issue.assigneeId && issue.assigneeId !== ctx.session.user.id) {
        await ctx.db.insert(notifications).values({
          userId: issue.assigneeId,
          type: "issue_commented",
          title: "New comment",
          message: `Left a comment on the task "${issue.title}"`,
          link: `/${issue.project.slug}/issue/${issue.id}`,
          metadata: {
            type: "issue_commented",
            issueId: input.issueId,
            commentId: comment.id,
          },
        });
      }

      return comment;
    }),

  update: protectedProcedure
    .input(updateCommentSchema)
    .mutation(async ({ input, ctx }) => {
      const comment = await ctx.db.query.comments.findFirst({
        where: eq(comments.id, input.commentId),
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      if (comment.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own comments",
        });
      }

      await ctx.db
        .update(comments)
        .set({ content: input.content, updatedAt: new Date() })
        .where(eq(comments.id, input.commentId));

      return { success: true };
    }),

  delete: protectedProcedure
    .input(deleteCommentSchema)
    .mutation(async ({ input, ctx }) => {
      const comment = await ctx.db.query.comments.findFirst({
        where: eq(comments.id, input.commentId),
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      if (comment.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own comments",
        });
      }

      await ctx.db.delete(comments).where(eq(comments.id, input.commentId));

      return { success: true };
    }),
});
