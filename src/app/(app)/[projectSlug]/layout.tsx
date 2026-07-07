import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { api } from "@/lib/trpc/client";
import { ProjectHeader } from "@/components/project/project-header";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <ProjectHeader project={project} />
      <div className="flex-1 flex overflow-hidden">{children}</div>
    </div>
  );
}
