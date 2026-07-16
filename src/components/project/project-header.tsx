"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Users } from "lucide-react";

import type { Project } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { ProjectEditModal } from "./edit-project-modal";
import { deleteProject } from "@/app/actions/project";
import { toast } from "@/components/ui/use-toast";
import { trpc } from "@/components/providers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { MembersList } from "./members-list";

interface ProjectHeaderProps {
  project: Project;
  currentUserId: string;
}

export function ProjectHeader({ project, currentUserId }: ProjectHeaderProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

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
      <div className="border-b bg-white/50 backdrop-blur-sm px-6 py-4 soft-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {project.description}
              </p>
            )}
          </div>
          <div className="flex gap-2 ml-4">
            <Dialog open={isMembersOpen} onOpenChange={setIsMembersOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Участники
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Участники проекта</DialogTitle>
                </DialogHeader>
                <MembersList
                  projectId={project.id}
                  currentUserId={currentUserId}
                />
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="hover:bg-primary/10 hover:text-primary hover:border-primary"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
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
