import { auth } from "@/lib/auth";
import { api } from "@/lib/trpc/client";
import { SidebarFilters } from "@/components/board/sidebar-filters";

export default async function SidebarPage({
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
    return null;
  }

  return <SidebarFilters projectId={project.id} />;
}
