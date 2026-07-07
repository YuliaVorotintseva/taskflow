import { Project } from "@/lib/db/schema";

interface ProjectHeaderProps {
  project: Project;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  return (
    <div className="border-b px-6 py-4">
      <h1 className="text-2xl font-bold">{project.name}</h1>
      {project.description && (
        <p className="text-sm text-muted-foreground mt-1">
          {project.description}
        </p>
      )}
    </div>
  );
}
