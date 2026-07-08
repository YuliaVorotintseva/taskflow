"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and, desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { issues, projects } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

const prioritySchema = z.enum(["low", "medium", "high"]);

const createIssueSchema = z.object({
  projectId: z.string().uuid(),
  columnId: z.string().uuid(),
  title: z.string().min(1, "Название обязательно").max(200),
  description: z.string().max(5000).optional(),
  priority: prioritySchema.optional(),
  projectSlug: z.string(),
});

export async function createIssue(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Необходима авторизация" };
  }

  const validatedFields = createIssueSchema.safeParse({
    projectId: formData.get("projectId"),
    columnId: formData.get("columnId"),
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority") || undefined,
    projectSlug: formData.get("projectSlug"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      error:
        validatedFields.error.flatten().fieldErrors.title?.[0] ||
        "Ошибка валидации",
    };
  }

  const { projectId, columnId, title, description, priority, projectSlug } =
    validatedFields.data;

  try {
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.userId, session.user.id),
      ),
    });

    if (!project) {
      return { success: false, error: "Проект не найден" };
    }

    const lastIssue = await db.query.issues.findFirst({
      where: eq(issues.columnId, columnId),
      orderBy: [desc(issues.position)],
    });

    const newPosition = lastIssue ? lastIssue.position + 1 : 0;

    const metadata = priority ? { priority } : {};

    await db.insert(issues).values({
      projectId,
      columnId,
      title,
      description: description || null,
      metadata,
      position: newPosition,
    });

    revalidatePath(`/${projectSlug}`);

    return { success: true };
  } catch (error) {
    console.error("Create issue error:", error);
    return {
      success: false,
      error: "Произошла ошибка при создании задачи",
    };
  }
}

export async function deleteIssue(issueId: string, projectSlug: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Необходима авторизация" };
  }

  try {
    const issue = await db.query.issues.findFirst({
      where: eq(issues.id, issueId),
      with: { project: true },
    });

    if (!issue || issue.project.userId !== session.user.id) {
      return { success: false, error: "Задача не найдена" };
    }

    await db.delete(issues).where(eq(issues.id, issueId));

    revalidatePath(`/${projectSlug}`);

    return { success: true };
  } catch (error) {
    console.error("Delete issue error:", error);
    return {
      success: false,
      error: "Произошла ошибка при удалении задачи",
    };
  }
}
