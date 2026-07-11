import { auth } from "@/lib/auth";
import { api } from "@/lib/trpc/client";
import { KanbanBoard } from "@/components/board/kanban-board";

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();

  if (!session) {
    return null;
  }

  const { projectSlug } = await params;
  const sp = await searchParams;

  const trpcApi = await api();
  const project = await trpcApi.project.getBySlug({
    slug: projectSlug,
  });

  if (!project) {
    return null;
  }

  const filters = {
    assigneeId: sp.assigneeId as string | undefined,
    priority: sp.priority as "low" | "medium" | "high" | undefined,
    search: sp.search as string | undefined,
  };

  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v !== undefined),
  );

  const boardData = await trpcApi.issue.getBoardData({
    projectId: project.id,
    filters:
      Object.keys(cleanFilters).length > 0
        ? (cleanFilters as {
            [k: string]: string | undefined;
          })
        : undefined,
  });

  return (
    <KanbanBoard
      projectId={project.id}
      projectSlug={projectSlug}
      data={boardData}
    />
  );
}
