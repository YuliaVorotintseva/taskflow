import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { api } from "@/lib/trpc/client";
import { ProjectHeader } from "@/components/project/project-header";

export default async function ProjectLayout({
  params,
  sidebar,
  board,
  activity,
}: {
  params: Promise<{ projectSlug: string }>;
  sidebar: React.ReactNode;
  board: React.ReactNode;
  activity: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    return null;
  }

  const { projectSlug } = await params;

  const trpcApi = await api();
  const project = await trpcApi.project.getBySlug({
    slug: projectSlug,
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <ProjectHeader project={project} />
      <div className="flex-1 flex overflow-hidden">
        {sidebar}
        {board}
        {activity}
      </div>
    </div>
  );
}
