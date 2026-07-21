import { formatDistanceToNow } from "date-fns";
import { enGB } from "date-fns/locale";

import { api } from "@/lib/trpc/client";
import { Card, CardContent } from "@/components/ui/card";

interface ActivityFeedProps {
  projectId: string;
}

export async function ActivityFeed({ projectId }: ActivityFeedProps) {
  const data = await api();
  const activities = await data.activity.getByProject({ projectId });

  const actionLabels: Record<string, string> = {
    created: "created",
    updated: "updated",
    deleted: "deleted",
    moved: "moved",
  };

  const entityLabels: Record<string, string> = {
    issue: "issue",
    column: "column",
    project: "project",
  };

  if (activities.length === 0) {
    return (
      <div className="w-80 border-l p-4">
        <h3 className="font-semibold mb-4">Activity</h3>
        <p className="text-sm text-muted-foreground">
          There is no activity in the project yet
        </p>
      </div>
    );
  }

  return (
    <div className="w-80 border-l p-4 flex-shrink-0 overflow-y-auto h-full">
      <h3 className="font-semibold mb-4">Activity</h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <Card key={activity.id}>
            <CardContent className="p-3">
              <p className="text-sm">
                <span className="font-medium">
                  {activity.user?.name || "User"}
                </span>{" "}
                {actionLabels[activity.action] || activity.action}{" "}
                {entityLabels[activity.entityType] || activity.entityType}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(activity.createdAt), {
                  addSuffix: true,
                  locale: enGB,
                })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
