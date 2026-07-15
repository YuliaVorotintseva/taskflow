import Link from "next/link";

import { Issue } from "@/lib/db/schema";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

export const IssueCard = ({
  issue,
  projectSlug,
  isDragging = false,
}: {
  issue: Issue;
  projectSlug: string;
  isDragging?: boolean;
}) => {
  return (
    <Link href={`/${projectSlug}/issue/${issue.id}`} className="block">
      <Card
        className={`group hover:shadow-md transition-all duration-200 cursor-default ${isDragging ? "shadow-xl scale-105" : ""}`}
      >
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
  );
};
