import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";

import { router, protectedProcedure } from "../trpc";
import { notifications } from "@/lib/db/schema";

export const notificationRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.notifications.findMany({
      where: eq(notifications.userId, ctx.session.user.id!),
      orderBy: [desc(notifications.createdAt)],
      limit: 50,
    });
  }),

  getUnread: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.notifications.findMany({
      where: and(
        eq(notifications.userId, ctx.session.user.id!),
        eq(notifications.isRead, false),
      ),
      orderBy: [desc(notifications.createdAt)],
      limit: 10,
    });
  }),

  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, ctx.session.user.id!),
          ),
        );

      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, ctx.session.user.id!),
          eq(notifications.isRead, false),
        ),
      );

    return { success: true };
  }),

  delete: protectedProcedure
    .input(z.object({ notificationId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .delete(notifications)
        .where(
          and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, ctx.session.user.id!),
          ),
        );

      return { success: true };
    }),
});
