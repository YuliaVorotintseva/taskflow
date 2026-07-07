"use client";

import { useRouter } from "next/navigation";

import { Issue } from "@/lib/db/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface IssueModalProps {
  issue: Issue;
  projectSlug: string;
}

export function IssueModal({ issue, projectSlug }: IssueModalProps) {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{issue.title}</DialogTitle>
          <DialogDescription>Задача в проекте {projectSlug}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {issue.description && (
            <div>
              <h4 className="font-semibold mb-2">Описание</h4>
              <p className="text-sm text-muted-foreground">
                {issue.description}
              </p>
            </div>
          )}

          {issue.metadata && (
            <div className="grid grid-cols-2 gap-4">
              {issue.metadata.priority && (
                <div>
                  <h4 className="font-semibold mb-1">Приоритет</h4>
                  <p className="text-sm">
                    {issue.metadata.priority === "high" && "Высокий"}
                    {issue.metadata.priority === "medium" && "Средний"}
                    {issue.metadata.priority === "low" && "Низкий"}
                  </p>
                </div>
              )}
              {issue.metadata.estimate && (
                <div>
                  <h4 className="font-semibold mb-1">Оценка</h4>
                  <p className="text-sm">{issue.metadata.estimate} часов</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
