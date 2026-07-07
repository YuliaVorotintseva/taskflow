import { ActivityFeed } from "@/components/board/activity-feed";

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ projectSlug: string }>;
}) {
  const { projectSlug } = await params;
  return <ActivityFeed projectSlug={projectSlug} />;
}
