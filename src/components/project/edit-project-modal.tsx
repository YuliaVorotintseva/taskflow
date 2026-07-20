"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateProject } from "@/app/actions/project";
import { toast } from "@/components/ui/use-toast";
import { trpc } from "@/components/providers";

interface ProjectEditModalProps {
  project: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
  };
  onClose: () => void;
}

export function ProjectEditModal({ project, onClose }: ProjectEditModalProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [name, setName] = useState(project.name);
  const [slug, setSlug] = useState(project.slug);
  const [description, setDescription] = useState(project.description || "");
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = useMemo(
    () =>
      name !== project.name ||
      slug !== project.slug ||
      description !== (project.description || ""),
    [name, slug, description, project],
  );

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugManuallyEdited) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generatedSlug);
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setSlugManuallyEdited(true);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Name and slug are required",
      });
      return;
    }

    setIsSaving(true);

    const formData = new FormData();
    formData.append("projectId", project.id);
    formData.append("currentSlug", project.slug);
    formData.append("name", name);
    formData.append("slug", slug);
    formData.append("description", description);

    const result = await updateProject(formData);

    setIsSaving(false);

    if (result.success) {
      toast({ title: "Project updated" });

      await utils.project.getAll.invalidate();
      await utils.project.getBySlug.invalidate({ slug: project.slug });
      if (result.newSlug) {
        await utils.project.getBySlug.prefetch({ slug: result.newSlug });
      }

      if (result.newSlug) {
        router.replace(`/${result.newSlug}`);
      } else {
        router.refresh();
      }
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "The error occurred",
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Project name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={isSaving}
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="slug">URL *</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/</span>
              <Input
                id="slug"
                placeholder="my-project"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Only Latin letters, numbers, and hyphens are allowed; changing the
              URL will change the project page address
            </p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Project description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !isDirty}>
              {isSaving ? "..." : "Save changes"}
            </Button>
          </div>

          {isDirty && (
            <p className="text-xs text-amber-600 text-center">
              ⚠ There are unsaved changes
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
