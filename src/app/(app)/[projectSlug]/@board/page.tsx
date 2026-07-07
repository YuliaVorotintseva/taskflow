import { auth } from "@/lib/auth";
import { api } from "@/lib/trpc/client";
import { KanbanBoard } from "@/components/board/kanban-board";

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectSlug: string }>;
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();

  if (!session) {
    return null;
  }

  const { projectSlug } = await params;
  const projectData = await api();
  const project = await projectData.project.getBySlug({
    slug: projectSlug,
  });

  if (!project) {
    return null;
  }

  const filters = {
    assigneeId: searchParams.assigneeId as string | undefined,
    priority: searchParams.priority as "low" | "medium" | "high" | undefined,
    search: searchParams.search as string | undefined,
  };

  const boardData = await api();
  const board = await boardData.issue.getBoardData({
    projectId: project.id,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
  });

  return <KanbanBoard projectId={project.id} data={board} />;
}
