"use client";

import { useSortable } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
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
    <div ref={setNodeRef} style={style} className="relative">
      <button
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="pl-8">
        <IssueCard
          issue={issue}
          projectSlug={projectSlug}
          isDragging={isDragging}
        />
      </div>
    </div>
  );
}
