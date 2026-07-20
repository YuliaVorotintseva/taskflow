import Link from "next/link";

import { Issue } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface IssuePageProps {
  issue: Issue;
  projectSlug: string;
}

export function IssuePage({ issue, projectSlug }: IssuePageProps) {
  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/${projectSlug}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Return to board
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{issue.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {issue.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm">{issue.description}</p>
            </div>
          )}

          {issue.metadata && (
            <div className="grid grid-cols-2 gap-4">
              {issue.metadata.priority && (
                <div>
                  <h3 className="font-semibold mb-1">Приоритет</h3>
                  <p className="text-sm">{issue.metadata.priority}</p>
                </div>
              )}
              {issue.metadata.estimate && (
                <div>
                  <h3 className="font-semibold mb-1">Rate</h3>
                  <p className="text-sm">{issue.metadata.estimate} hours</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
