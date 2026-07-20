"use client";

import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/components/providers";

interface SidebarFiltersProps {
  projectId: string;
}

export function SidebarFilters({ projectId }: SidebarFiltersProps) {
  const [filters, setFilters] = useQueryStates(
    {
      search: parseAsString.withDefault(""),
      priority: parseAsStringEnum(["low", "medium", "high"]),
      assigneeId: parseAsString,
    },
    {
      history: "push",
      shallow: false,
    },
  );

  const { data: allIssues } = trpc.issue.listByProject.useQuery(
    {
      projectId,
      limit: 100,
    },
    {
      refetchOnWindowFocus: true,
      staleTime: 0,
    },
  );

  const assignees = allIssues
    ? Array.from(
        new Map(
          allIssues
            .filter((i) => i.assignee)
            .map((i) => [i.assignee!.id, i.assignee!]),
        ).values(),
      )
    : [];

  const hasActiveFilters =
    filters.search || filters.priority || filters.assigneeId;

  const priorityLabels = {
    low: "low",
    medium: "medium",
    high: "hight",
  };

  return (
    <div className="w-64 border-r p-4 flex-shrink-0 overflow-y-auto h-full">
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-3">Filters</h3>

          <div className="space-y-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Issue title..."
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value || null })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Priority</Label>
              <div className="space-y-2 mt-2">
                {(["low", "medium", "high"] as const).map((p) => (
                  <Button
                    key={p}
                    variant={filters.priority === p ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() =>
                      setFilters({
                        priority: filters.priority === p ? null : p,
                      })
                    }
                  >
                    {priorityLabels[p]}
                  </Button>
                ))}
              </div>
            </div>

            {assignees.length > 0 && (
              <div>
                <Label>Assignee</Label>
                <div className="space-y-2 mt-2">
                  {assignees.map((assignee) => (
                    <Button
                      key={assignee.id}
                      variant={
                        filters.assigneeId === assignee.id
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className="w-full justify-start"
                      onClick={() =>
                        setFilters({
                          assigneeId:
                            filters.assigneeId === assignee.id
                              ? null
                              : assignee.id,
                        })
                      }
                    >
                      {assignee.name || assignee.email}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setFilters({
                    search: null,
                    priority: null,
                    assigneeId: null,
                  })
                }
                className="w-full"
              >
                Reset filters
              </Button>
            )}
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-2 text-sm">Statistics</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Summary: {allIssues?.length || 0}</div>
            {filters.priority && (
              <div>
                With filter:{" "}
                {allIssues?.filter(
                  (i) => i.metadata?.priority === filters.priority,
                ).length || 0}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
