import { useState } from "react";

import { createIssue } from "@/app/actions/issue";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "../providers";

export const AddIssueForm = ({
  projectId,
  columnId,
  projectSlug,
  onCancel,
  onAdded,
}: {
  projectId: string;
  columnId: string;
  projectSlug: string;
  onCancel: () => void;
  onAdded: () => void;
}) => {
  const [title, setTitle] = useState("");
  const [isPending, setIsPending] = useState(false);
  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    setIsPending(true);

    const formData = new FormData();
    formData.append("projectId", projectId);
    formData.append("columnId", columnId);
    formData.append("title", title);
    formData.append("projectSlug", projectSlug);

    const result = await createIssue(formData);

    setIsPending(false);

    if (result.success) {
      setTitle("");
      toast({
        title: "The issue is created",
      });

      await utils.issue.listByProject.invalidate({ projectId });
      await utils.issue.getBoardData.invalidate({ projectId });

      onAdded();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: (result as { success: boolean; error: string }).error,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        placeholder="Title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={isPending}
        autoFocus
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "..." : "Create"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};
