import { auth } from "@/lib/auth";
import { api } from "@/lib/trpc/client";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectSlug: string }>;
}) {
  const session = await auth();

  if (!session) {
    return null;
  }

  const { projectSlug } = await params;
  const trpcApi = await api();

  const project = await trpcApi.project.getBySlug({ slug: projectSlug });

  if (!project) {
    return <div>Project not found</div>;
  }

  return null;
}
