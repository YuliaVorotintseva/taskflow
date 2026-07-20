"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

import type { Project } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectEditModal } from "./edit-project-modal";
import { deleteProject } from "@/app/actions/project";
import { toast } from "@/components/ui/use-toast";
import { trpc } from "@/components/providers";
import { ConfirmDialog } from "../ui/confirm-dialog";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const utils = trpc.useUtils();

  const handleDelete = async () => {
    setIsDeleting(true);

    const result = await deleteProject(project.id);

    setIsDeleting(false);

    if (result.success) {
      toast({ title: "Project deleted" });
      await utils.project.getAll.invalidate();
      setShowDeleteDialog(false);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          (result as { success: boolean; error: string }).error ||
          "The error occurred",
      });
    }
  };

  return (
    <>
      <Card className="hover-lift group bg-white border-gray-200">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <Link href={`/${project.slug}`} className="flex-1">
              <CardTitle className="text-lg hover:text-primary transition-colors">
                {project.name}
              </CardTitle>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {project.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {project.description}
            </p>
          )}
          <div className="text-xs text-muted-foreground">/{project.slug}</div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete the column?"
        description={`Are you sure you want to delete the project "${project.name}"?`}
        confirmText="Delete"
      />

      {isEditing && (
        <ProjectEditModal
          project={project}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  );
}
