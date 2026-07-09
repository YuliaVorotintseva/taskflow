"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProject } from "@/app/actions/project";
import { toast } from "@/components/ui/use-toast";

export function CreateProjectForm() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!isCreating) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generatedSlug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !slug.trim()) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Заполните обязательные поля",
      });
      return;
    }

    setIsPending(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("slug", slug);
    formData.append("description", description);

    const result = await createProject(formData);

    setIsPending(false);

    if (result.success && result.projectSlug) {
      toast({
        title: "Проект создан",
        description: "Перенаправляем на страницу проекта...",
      });
      router.push(`/${result.projectSlug}`);
    } else {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: result.error || "Произошла ошибка",
      });
    }
  };

  if (!isCreating) {
    return (
      <Card
        className="border-dashed hover:shadow-md transition-shadow cursor-pointer h-full flex items-center justify-center"
        onClick={() => setIsCreating(true)}
      >
        <CardContent className="p-8 text-center">
          <div className="text-4xl mb-2">+</div>
          <div className="text-muted-foreground">Создать новый проект</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle>Новый проект</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Название *</Label>
            <Input
              id="name"
              placeholder="Мой проект"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={isPending}
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
                onChange={(e) => setSlug(e.target.value)}
                disabled={isPending}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Только латинские буквы, цифры и дефис
            </p>
          </div>

          <div>
            <Label htmlFor="description">Описание</Label>
            <Input
              id="description"
              placeholder="Краткое описание проекта"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Создание..." : "Создать проект"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsCreating(false);
                setName("");
                setSlug("");
                setDescription("");
              }}
              disabled={isPending}
            >
              Отмена
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
