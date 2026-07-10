"use client";

import { useOptimistic, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  PointerSensor,
} from "@dnd-kit/core";

import type { Column, Issue } from "@/lib/db/schema";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { AddColumnForm } from "./add-column-form";
import { moveIssue } from "@/app/actions/issue";
import { toast } from "../ui/use-toast";
import { IssueCard } from "./issue-card";
import { SortableColumn } from "./sortable-column";

interface KanbanBoardProps {
  projectId: string;
  projectSlug: string;
  data: {
    columns: Array<Column & { issues: Issue[] }>;
  };
}

type OptimisticBoard = {
  columns: Array<Column & { issues: Issue[] }>;
};

type OptimisticAction =
  | {
      type: "MOVE_ISSUE";
      payload: {
        issueId: string;
        fromColumnId: string;
        toColumnId: string;
        newPosition: number;
      };
    }
  | {
      type: "RESET";
      payload: {
        columns: Array<Column & { issues: Issue[] }>;
      };
    };

const boardReducer = (
  state: OptimisticBoard,
  action: OptimisticAction,
): OptimisticBoard => {
  switch (action.type) {
    case "MOVE_ISSUE": {
      const { issueId, fromColumnId, toColumnId, newPosition } = action.payload;

      const newColumns = state.columns.map((col) => ({
        ...col,
        issues: [...col.issues],
      }));

      const fromCol = newColumns.find((c) => c.id === fromColumnId);
      const toCol = newColumns.find((c) => c.id === toColumnId);

      if (!fromCol || !toCol) return state;

      const issueIndex = fromCol.issues.findIndex((i) => i.id === issueId);
      if (issueIndex === -1) return state;

      const [issue] = fromCol.issues.splice(issueIndex, 1);

      const safePosition = Math.min(newPosition, toCol.issues.length);
      toCol.issues.splice(safePosition, 0, issue);

      return { columns: newColumns };
    }
    case "RESET": {
      return { columns: action.payload.columns };
    }
    default:
      return state;
  }
};

export function KanbanBoard({
  projectId,
  projectSlug,
  data,
}: KanbanBoardProps) {
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);

  const [optimisticBoard, setOptimisticBoard] = useOptimistic<
    OptimisticBoard,
    OptimisticAction
  >({ columns: data.columns }, boardReducer);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === "issue") {
      setActiveIssue(activeData.issue);
    } else if (activeData?.type === "column") {
      setActiveColumn(activeData.column);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    if (activeData?.type !== "issue") return;

    const activeIssueId = active.id as string;
    const overId = over.id as string;

    let toColumnId: string | null = null;
    let newPosition = 0;

    const overData = over.data.current;

    if (overData?.type === "column") {
      toColumnId = overId;
      const toCol = optimisticBoard.columns.find((c) => c.id === toColumnId);
      newPosition = toCol?.issues.length || 0;
    } else if (overData?.type === "issue") {
      const overIssue = overData.issue as Issue;
      toColumnId = overIssue.columnId;
      const toCol = optimisticBoard.columns.find((c) => c.id === toColumnId);
      if (toCol) {
        newPosition = toCol.issues.findIndex((i) => i.id === overIssue.id);
        if (newPosition === -1) newPosition = toCol.issues.length;
      }
    }

    if (!toColumnId) return;

    const fromColumnId = activeData.issue.columnId;

    setOptimisticBoard({
      type: "MOVE_ISSUE",
      payload: {
        issueId: activeIssueId,
        fromColumnId,
        toColumnId,
        newPosition,
      },
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIssue(null);
    setActiveColumn(null);

    if (!over) return;

    const activeData = active.data.current;
    if (activeData?.type !== "issue") return;

    const issueId = active.id as string;
    const overId = over.id as string;

    const originalColumn = data.columns.find((c) =>
      c.issues.some((i) => i.id === issueId),
    );
    if (!originalColumn) return;

    let toColumnId: string | null = null;
    let newPosition = 0;

    const overData = over.data.current;

    if (overData?.type === "column") {
      toColumnId = overId;
      const toCol = data.columns.find((c) => c.id === toColumnId);
      newPosition = toCol?.issues.length || 0;
    } else if (overData?.type === "issue") {
      const overIssue = overData.issue as Issue;
      toColumnId = overIssue.columnId;
      const toCol = data.columns.find((c) => c.id === toColumnId);
      if (toCol) {
        newPosition = toCol.issues.findIndex((i) => i.id === overIssue.id);
        if (newPosition === -1) newPosition = toCol.issues.length;
      }
    }

    if (!toColumnId) return;

    const fromColumnId = originalColumn.id;

    if (
      fromColumnId === toColumnId &&
      originalColumn.issues.findIndex((i) => i.id === issueId) === newPosition
    ) {
      return;
    }

    const formData = new FormData();
    formData.append("issueId", issueId);
    formData.append("projectId", projectId);
    formData.append("projectSlug", projectSlug);
    formData.append("fromColumnId", fromColumnId);
    formData.append("toColumnId", toColumnId);
    formData.append("newPosition", newPosition.toString());

    const result = await moveIssue(formData);

    if (!result.success) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: result.error,
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 flex gap-4 p-4 overflow-x-auto">
        {optimisticBoard.columns.map((column) => (
          <SortableColumn
            key={column.id}
            column={column}
            projectId={projectId}
            projectSlug={projectSlug}
          />
        ))}
        <AddColumnForm projectId={projectId} projectSlug={projectSlug} />
      </div>

      <DragOverlay>
        {activeIssue && (
          <div className="rotate-3 opacity-90">
            <IssueCard
              issue={activeIssue}
              projectSlug={projectSlug}
              isDragging
            />
          </div>
        )}
        {activeColumn && (
          <div className="rotate-2 opacity-90 w-80">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {activeColumn.name}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
