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

  let project;
  try {
    project = await trpcApi.project.getBySlug({
      slug: projectSlug,
    });
  } catch (error: unknown) {
    console.error(error);
    notFound();
  }

  if (!project) {
    notFound();
  }

  return (
    <div className="flex flex-col overflow-hidden">
      <ProjectHeader project={project} />
      <div className="flex-1 flex">
        {sidebar}
        <div className="flex-1">{board}</div>
        {activity}
        {children}
      </div>
    </div>
  );
}
