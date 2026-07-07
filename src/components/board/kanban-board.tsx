"use client";

import Link from "next/link";

import { Column, Issue } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface KanbanBoardProps {
  projectId: string;
  data: {
    columns: Array<Column & { issues: Issue[] }>;
  };
}

export function KanbanBoard({ projectId, data }: KanbanBoardProps) {
  return (
    <div className="flex-1 flex gap-4 p-4 overflow-x-auto">
      {data.columns.map((column) => (
        <div key={column.id} className="flex-shrink-0 w-80">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {column.name}
                <Badge variant="secondary" className="ml-2">
                  {column.issues.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {column.issues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/${projectId}/issue/${issue.id}`}
                  className="block"
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="font-medium text-sm mb-2">
                        {issue.title}
                      </div>
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
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
