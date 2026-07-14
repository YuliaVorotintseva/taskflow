"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import type { Column, Issue } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SortableIssueCard } from "./sortable-issue-card";
import { AddIssueForm } from "./add-issue-form";
import { toast } from "../ui/use-toast";
import { deleteColumn, updateColumn } from "@/app/actions/column";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { Input } from "../ui/input";

interface SortableColumnProps {
  column: Column & { issues: Issue[] };
  projectId: string;
  projectSlug: string;
}

export function SortableColumn({
  column,
  projectId,
  projectSlug,
}: SortableColumnProps) {
  const [isAddingIssue, setIsAddingIssue] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(column.name);
  const [isSaving, setIsSaving] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
  });

  const issueIds = column.issues.map((issue) => issue.id);

  const handleSaveTitle = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Название не может быть пустым",
      });
      setTitle(column.name);
      setIsEditingTitle(false);
      return;
    }

    if (trimmedTitle === column.name) {
      setIsEditingTitle(false);
      return;
    }

    setIsSaving(true);
    const formData = new FormData();
    formData.append("columnId", column.id);
    formData.append("projectId", projectId);
    formData.append("projectSlug", projectSlug);
    formData.append("name", trimmedTitle);

    const result = await updateColumn(formData);
    setIsSaving(false);

    if (result.success) {
      setIsEditingTitle(false);
    } else {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: result.error,
      });
      setTitle(column.name);
    }
  };

  const handleDeleteColumn = async () => {
    if (column.issues.length > 0) {
      toast({
        variant: "destructive",
        title: "Нельзя удалить колонку",
        description: `В колонке есть ${column.issues.length} задач(и). Переместите или удалите их сначала.`,
      });
      return;
    }

    if (!confirm(`Вы уверены, что хотите удалить колонку "${column.name}"?`)) {
      return;
    }

    const result = await deleteColumn(column.id, projectSlug);

    if (result.success) {
      toast({ title: "Колонка удалена" });
    } else {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: result.error,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveTitle();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setTitle(column.name);
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="flex-shrink-0 w-80">
      <Card className={isOver ? "ring-2 ring-primary" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSaveTitle}
                  className="h-7 text-sm font-medium"
                  autoFocus
                  disabled={isSaving}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveTitle();
                    }}
                    disabled={isSaving}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTitle(column.name);
                      setIsEditingTitle(false);
                    }}
                    disabled={isSaving}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <CardTitle
                  className="text-sm font-medium flex-1 cursor-pointer hover:text-primary transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingTitle(true);
                  }}
                >
                  {column.name}
                  <Badge variant="secondary" className="ml-2">
                    {column.issues.length}
                  </Badge>
                </CardTitle>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingTitle(true);
                    }}
                    title="Редактировать название"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteColumn();
                    }}
                    title="Удалить колонку"
                    disabled={column.issues.length > 0}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div ref={setNodeRef} className="min-h-[50px] space-y-2">
            <SortableContext
              items={issueIds}
              strategy={verticalListSortingStrategy}
            >
              {column.issues.map((issue) => (
                <SortableIssueCard
                  key={issue.id}
                  issue={issue}
                  projectSlug={projectSlug}
                />
              ))}
            </SortableContext>
          </div>

          {isAddingIssue ? (
            <AddIssueForm
              projectId={projectId}
              columnId={column.id}
              projectSlug={projectSlug}
              onCancel={() => setIsAddingIssue(false)}
              onAdded={() => setIsAddingIssue(false)}
            />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
              onClick={() => setIsAddingIssue(true)}
            >
              + Добавить задачу
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
