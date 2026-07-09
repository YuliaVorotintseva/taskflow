"use client";

import { useState } from "react";
import Link from "next/link";

import type { Column, Issue } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddIssueForm } from "./add-issue-form";
import { AddColumnForm } from "./add-column-form";

interface KanbanBoardProps {
  projectId: string;
  projectSlug: string;
  data: {
    columns: Array<Column & { issues: Issue[] }>;
  };
}

const BoardColumn = ({
  column,
  projectId,
  projectSlug,
}: {
  column: Column & { issues: Issue[] };
  projectId: string;
  projectSlug: string;
}) => {
  const [isAddingIssue, setIsAddingIssue] = useState(false);

  return (
    <div className="flex-shrink-0 w-80">
      <Card>
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
          {column.issues.map((issue) => (
            <Link
              key={issue.id}
              href={`/${projectSlug}/issue/${issue.id}`}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="font-medium text-sm mb-2">{issue.title}</div>
                  {issue.metadata?.priority && (
                    <Badge
                      variant={
                        issue.metadata.priority === "high"
                          ? "destructive"
                          : issue.metadata.priority === "medium"
                            ? "default"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {issue.metadata.priority === "high" && "Высокий"}
                      {issue.metadata.priority === "medium" && "Средний"}
                      {issue.metadata.priority === "low" && "Низкий"}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}

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
};

export function KanbanBoard({
  projectId,
  projectSlug,
  data,
}: KanbanBoardProps) {
  return (
    <div className="flex-1 flex gap-4 p-4 overflow-x-auto">
      {data.columns.map((column) => (
        <BoardColumn
          key={column.id}
          column={column}
          projectId={projectId}
          projectSlug={projectSlug}
        />
      ))}
      <AddColumnForm projectId={projectId} projectSlug={projectSlug} />
    </div>
  );
}
