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

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
  });

  const issueIds = column.issues.map((issue) => issue.id);

  return (
    <div className="flex-shrink-0 w-80 max-w-sm">
      <Card className={isOver ? "ring-2 ring-primary" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              {column.name}
              <Badge variant="secondary" className="ml-2">
                {column.issues.length}
              </Badge>
            </CardTitle>
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
