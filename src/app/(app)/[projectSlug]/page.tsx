import { auth } from "@/lib/auth";
import { api } from "@/lib/trpc/client";
import { KanbanBoard } from "@/components/board/kanban-board";

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
    return <div>Проект не найден</div>;
  }

  const boardData = await trpcApi.issue.getBoardData({ projectId: project.id });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{project.name}</h1>
      <KanbanBoard
        projectId={project.id}
        projectSlug={projectSlug}
        data={boardData}
      />
    </div>
  );
}
