import { Card, CardContent } from "@/components/ui/card";

interface ActivityFeedProps {
  projectSlug: string;
}

export function ActivityFeed({ projectSlug }: ActivityFeedProps) {
  console.log(projectSlug);

  const activities = [
    {
      id: 1,
      text: 'Задача "Implement feature" создана',
      time: "5 минут назад",
    },
    {
      id: 2,
      text: 'Задача "Fix bug" перемещена в Done',
      time: "10 минут назад",
    },
    { id: 3, text: "Новый комментарий к задаче", time: "1 час назад" },
  ];

  return (
    <div className="w-80 border-l p-4">
      <h3 className="font-semibold mb-4">Активность</h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <Card key={activity.id}>
            <CardContent className="p-3">
              <p className="text-sm">{activity.text}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {activity.time}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
