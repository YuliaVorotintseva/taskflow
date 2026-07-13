import { notFound } from "next/navigation";
import { ReactNode } from "react";

import { auth } from "@/lib/auth";
import { api } from "@/lib/trpc/client";
import { ProjectHeader } from "@/components/project/project-header";

export default async function ProjectLayout({
  params,
  sidebar,
  board,
  activity,
  children,
}: {
  params: Promise<{ projectSlug: string }>;
  sidebar: ReactNode;
  board: ReactNode;
  activity: ReactNode;
  children: ReactNode;
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
      <div className="flex-1 flex overflow-hidden min-w-0">
        {sidebar}
        <div className="flex-1 min-w-0">{board}</div>
        {activity}
        {children}
      </div>
    </div>
  );
}
