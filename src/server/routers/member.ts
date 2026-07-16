import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { router, protectedProcedure } from "../trpc";
import {
  projectMembers,
  projects,
  notifications,
  users,
} from "@/lib/db/schema";
import { NotificationMetadata } from "@/lib/db/notification-types";

const inviteMemberSchema = z.object({
  projectId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["admin", "member", "viewer"]).default("member"),
});

const updateMemberRoleSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string(),
  role: z.enum(["admin", "member", "viewer"]),
});

const removeMemberSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string(),
});

export const memberRouter = router({
  getByProject: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.query.projectMembers.findMany({
        where: eq(projectMembers.projectId, input.projectId),
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
        orderBy: [projectMembers.joinedAt],
      });
    }),

  invite: protectedProcedure
    .input(inviteMemberSchema)
    .mutation(async ({ input, ctx }) => {
      const currentMember = await ctx.db.query.projectMembers.findFirst({
        where: and(
          eq(projectMembers.projectId, input.projectId),
          eq(projectMembers.userId, ctx.session.user.id!),
        ),
      });

      if (!currentMember || !["owner", "admin"].includes(currentMember.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Только владелец или администратор может приглашать участников",
        });
      }

      const user = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Пользователь с таким email не найден",
        });
      }

      const existingMember = await ctx.db.query.projectMembers.findFirst({
        where: and(
          eq(projectMembers.projectId, input.projectId),
          eq(projectMembers.userId, user.id),
        ),
      });

      if (existingMember) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Пользователь уже является участником проекта",
        });
      }

      const [member] = await ctx.db
        .insert(projectMembers)
        .values({
          projectId: input.projectId,
          userId: user.id,
          role: input.role,
          joinedAt: new Date(),
        })
        .returning();

      const project = await ctx.db.query.projects.findFirst({
        where: eq(projects.id, input.projectId),
      });

      await ctx.db.insert(notifications).values({
        userId: user.id,
        type: "project_invited",
        title: "Приглашение в проект",
        message: `Вы были добавлены в проект "${project?.name}"`,
        link: project ? `/${project.slug}` : null,
        metadata: {
          type: "project_invited",
          projectId: input.projectId,
          invitedBy: ctx.session.user.id,
        } as NotificationMetadata,
      });

      return member;
    }),

  updateRole: protectedProcedure
    .input(updateMemberRoleSchema)
    .mutation(async ({ input, ctx }) => {
      const currentMember = await ctx.db.query.projectMembers.findFirst({
        where: and(
          eq(projectMembers.projectId, input.projectId),
          eq(projectMembers.userId, ctx.session.user.id!),
        ),
      });

      if (!currentMember || currentMember.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Только владелец проекта может изменять роли",
        });
      }

      if (input.userId === currentMember.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Нельзя изменить роль владельца проекта",
        });
      }

      await ctx.db
        .update(projectMembers)
        .set({ role: input.role })
        .where(
          and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, input.userId),
          ),
        );

      return { success: true };
    }),

  remove: protectedProcedure
    .input(removeMemberSchema)
    .mutation(async ({ input, ctx }) => {
      const currentMember = await ctx.db.query.projectMembers.findFirst({
        where: and(
          eq(projectMembers.projectId, input.projectId),
          eq(projectMembers.userId, ctx.session.user.id!),
        ),
      });

      if (!currentMember || !["owner", "admin"].includes(currentMember.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Только владелец или администратор может удалять участников",
        });
      }

      const targetMember = await ctx.db.query.projectMembers.findFirst({
        where: and(
          eq(projectMembers.projectId, input.projectId),
          eq(projectMembers.userId, input.userId),
        ),
      });

      if (targetMember?.role === "owner") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Нельзя удалить владельца проекта",
        });
      }

      await ctx.db
        .delete(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, input.userId),
          ),
        );

      return { success: true };
    }),
});
