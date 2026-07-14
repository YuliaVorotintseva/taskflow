"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import type { Project } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { ProjectEditModal } from "./edit-project-modal";
import { deleteProject } from "@/app/actions/project";
import { toast } from "@/components/ui/use-toast";
import { trpc } from "@/components/providers";

interface ProjectHeaderProps {
  project: Project;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        `Вы уверены, что хотите удалить проект "${project.name}"? 
      Все задачи и колонки будут удалены без возможности восстановления.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);

    const result = await deleteProject(project.id);

    setIsDeleting(false);

    if (result.success) {
      toast({ title: "Проект удалён" });
      await utils.project.getAll.invalidate();
      router.replace("/dashboard");
    } else {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: result.error || "Произошла ошибка",
      });
    }
  };

  return (
    <>
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {project.description}
              </p>
            )}
          </div>
          <div className="flex gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "Удаление..." : "Удалить"}
            </Button>
          </div>
        </div>
      </div>

      {isEditing && (
        <ProjectEditModal
          project={project}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  );
}
