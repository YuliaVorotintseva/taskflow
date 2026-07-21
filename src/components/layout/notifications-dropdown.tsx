"use client";

import { trpc } from "@/components/providers";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enGB } from "date-fns/locale";
import { useRouter } from "next/navigation";

export function NotificationsDropdown() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: unreadNotifications } = trpc.notification.getUnread.useQuery();
  const { data: allNotifications } = trpc.notification.getAll.useQuery();

  const unreadCount = unreadNotifications?.length || 0;

  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: async () => {
      await utils.notification.getUnread.invalidate();
      await utils.notification.getAll.invalidate();
    },
  });

  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: async () => {
      await utils.notification.getUnread.invalidate();
      await utils.notification.getAll.invalidate();
    },
  });

  const markAsRead = async (notificationId: string, link?: string | null) => {
    await markAsReadMutation.mutateAsync({ notificationId });

    if (link) {
      router.push(link);
    }
  };

  const markAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2 border-b">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Read all
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {allNotifications?.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            allNotifications?.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer ${
                  !notification.isRead ? "bg-muted/50" : ""
                }`}
                onClick={() => markAsRead(notification.id, notification.link)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-sm">
                    {notification.title}
                  </span>
                  {!notification.isRead && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {notification.message}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                    locale: enGB,
                  })}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
