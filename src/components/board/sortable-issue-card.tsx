"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Issue } from "@/lib/db/schema";
import { IssueCard } from "./issue-card";

interface SortableIssueCardProps {
  issue: Issue;
  projectSlug: string;
}

export function SortableIssueCard({
  issue,
  projectSlug,
}: SortableIssueCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: issue.id,
    data: {
      type: "issue",
      issue,
      columnId: issue.columnId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <IssueCard
        issue={issue}
        projectSlug={projectSlug}
        isDragging={isDragging}
      />
    </div>
  );
}
