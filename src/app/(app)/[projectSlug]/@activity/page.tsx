import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { api } from "@/lib/trpc/client";
import { ActivityFeed } from "@/components/board/activity-feed";

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ projectSlug: string }>;
}) {
  const session = await auth();

  if (!session) {
    return null;
  }

  const { projectSlug } = await params;

  const data = await api();
  const project = await data.project.getBySlug({
    slug: projectSlug,
  });

  if (!project) {
    notFound();
  }

  return <ActivityFeed projectId={project.id} />;
}
