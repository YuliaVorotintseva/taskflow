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
    <div className="flex flex-col flex-1 w-full overflow-hidden bg-background">
      <div className="flex-shrink-0 w-full z-20 border-b bg-background">
        <ProjectHeader
          project={project}
          currentUserId={session.user?.id || ""}
        />
      </div>

      <div className="flex-1 flex overflow-hidden w-full">
        <div className="w-64 flex-shrink-0 border-r bg-background overflow-y-auto">
          {sidebar}
        </div>

        <div className="flex-1 min-w-0 overflow-x-auto overflow-y-auto bg-muted/10 relative">
          {board}
        </div>

        <div className="w-80 flex-shrink-0 border-l bg-background overflow-y-auto">
          {activity}
        </div>

        {children}
      </div>
    </div>
  );
}
