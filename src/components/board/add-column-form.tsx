import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createColumn } from "@/app/actions/column";
import { toast } from "@/components/ui/use-toast";

export const AddColumnForm = ({
  projectId,
  projectSlug,
}: {
  projectId: string;
  projectSlug: string;
}) => {
  const [name, setName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    setIsPending(true);

    const formData = new FormData();
    formData.append("projectId", projectId);
    formData.append("name", name);
    formData.append("projectSlug", projectSlug);

    const result = await createColumn(formData);

    setIsPending(false);

    if (result.success) {
      setName("");
      setIsAdding(false);
      toast({
        title: "The column is created",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    }
  };

  if (!isAdding) {
    return (
      <div className="flex-shrink-0 w-80">
        <Card className="border-dashed">
          <CardContent className="p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
              onClick={() => setIsAdding(true)}
            >
              + Add new column
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 w-80">
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-2">
            <Input
              placeholder="Title..."
              value={name}
              onChange={(e) => setName(e.target.value)}
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
                onClick={() => {
                  setIsAdding(false);
                  setName("");
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
