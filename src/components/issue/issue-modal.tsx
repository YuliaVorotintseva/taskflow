"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import type { Issue } from "@/lib/db/schema";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { updateIssue, deleteIssue } from "@/app/actions/issue";
import { toast } from "@/components/ui/use-toast";
import { trpc } from "@/components/providers";
import { CommentsSection } from "./comments-section";

interface IssueModalProps {
  issue: Issue;
  projectSlug: string;
  currentUserId: string;
}

export const IssueModal = ({
  issue,
  projectSlug,
  currentUserId,
}: IssueModalProps) => {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description || "");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | null>(
    issue.metadata?.priority || null,
  );
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = useMemo(() => {
    return (
      title !== issue.title ||
      description !== (issue.description || "") ||
      priority !== (issue.metadata?.priority || null)
    );
  }, [title, description, priority, issue]);

  const handleClose = (open: boolean) => {
    if (!open) {
      router.back();
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Название не может быть пустым",
      });
      return;
    }

    setIsSaving(true);

    const formData = new FormData();
    formData.append("issueId", issue.id);
    formData.append("projectId", issue.projectId);
    formData.append("projectSlug", projectSlug);
    formData.append("title", title);
    formData.append("description", description);
    if (priority) {
      formData.append("priority", priority);
    }

    const result = await updateIssue(formData);

    setIsSaving(false);

    if (result.success) {
      toast({ title: "Задача обновлена" });

      await utils.issue.listByProject.invalidate({
        projectId: issue.projectId,
      });
      await utils.issue.getBoardData.invalidate({ projectId: issue.projectId });
      await utils.issue.getById.invalidate({ id: issue.id });
    } else {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: result.error,
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить задачу?")) {
      return;
    }

    const result = await deleteIssue(issue.id, projectSlug);

    if (result.success) {
      toast({ title: "Задача удалена" });

      await utils.issue.listByProject.invalidate({
        projectId: issue.projectId,
      });
      await utils.issue.getBoardData.invalidate({ projectId: issue.projectId });
      await utils.issue.getById.invalidate({ id: issue.id });

      router.push(`/${projectSlug}`);
    } else {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: result.error,
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty) {
          handleSave();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDirty, handleSave]);

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-semibold border-none shadow-none focus-visible:ring-0 px-0"
                placeholder="Название задачи"
              />
            </div>
            <div className="flex gap-2 ml-4">
              {isDirty && (
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Сохранение..." : "Сохранить"}
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={handleDelete}>
                Удалить
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Приоритет</Label>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as const).map((p) => (
                <Button
                  key={p}
                  variant={priority === p ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPriority(priority === p ? null : p)}
                >
                  {p === "low" && "Низкий"}
                  {p === "medium" && "Средний"}
                  {p === "high" && "Высокий"}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Описание</Label>
            <MarkdownEditor
              content={description}
              onChange={setDescription}
              placeholder="Добавьте описание задачи..."
            />
          </div>

          <div className="text-xs text-muted-foreground pt-4 border-t">
            <div>
              Создано: {new Date(issue.createdAt).toLocaleString("ru-RU")}
            </div>
            <div>
              Обновлено: {new Date(issue.updatedAt).toLocaleString("ru-RU")}
            </div>
            {isDirty && (
              <div className="text-amber-600 mt-1">
                ⚠ Есть несохранённые изменения (Cmd+S для сохранения)
              </div>
            )}
          </div>
        </div>
        <div className="border-t pt-4 mt-4">
          <CommentsSection issueId={issue.id} currentUserId={currentUserId} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
