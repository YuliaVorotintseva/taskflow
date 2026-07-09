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

  const data = await api();
  const { projectSlug } = await params;
  const search = await searchParams;

  const project = await data.project.getBySlug({
    slug: projectSlug,
  });

  if (!project) {
    return null;
  }

  const filters = {
    assigneeId: search.assigneeId as string | undefined,
    priority: search.priority as "low" | "medium" | "high" | undefined,
    search: search.search as string | undefined,
  };

  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v !== undefined),
  );

  const boardData = await data.issue.getBoardData({
    projectId: project.id,
    filters:
      Object.keys(cleanFilters).length > 0
        ? (cleanFilters as {
            assigneeId?: string | undefined;
            priority?: "low" | "medium" | "high" | undefined;
            search?: string | undefined;
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
