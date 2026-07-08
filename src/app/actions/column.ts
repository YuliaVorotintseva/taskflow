"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and, desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { columns, projects } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

const createColumnSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1, "Название обязательно").max(50),
  projectSlug: z.string(),
});

export async function createColumn(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Необходима авторизация" };
  }

  const validatedFields = createColumnSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    projectSlug: formData.get("projectSlug"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      error:
        validatedFields.error.flatten().fieldErrors.name?.[0] ||
        "Ошибка валидации",
    };
  }

  const { projectId, name, projectSlug } = validatedFields.data;

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

    const lastColumn = await db.query.columns.findFirst({
      where: eq(columns.projectId, projectId),
      orderBy: [desc(columns.position)],
    });

    const newPosition = lastColumn ? lastColumn.position + 1 : 0;

    await db.insert(columns).values({
      projectId,
      name,
      position: newPosition,
    });

    revalidatePath(`/${projectSlug}`);

    return { success: true };
  } catch (error) {
    console.error("Create column error:", error);
    return {
      success: false,
      error: "Произошла ошибка при создании колонки",
    };
  }
}

export async function deleteColumn(columnId: string, projectSlug: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Необходима авторизация" };
  }

  try {
    const column = await db.query.columns.findFirst({
      where: eq(columns.id, columnId),
      with: { project: true },
    });

    if (!column || column.project.userId !== session.user.id) {
      return { success: false, error: "Колонка не найдена" };
    }

    await db.delete(columns).where(eq(columns.id, columnId));

    revalidatePath(`/${projectSlug}`);

    return { success: true };
  } catch (error) {
    console.error("Delete column error:", error);
    return {
      success: false,
      error: "Произошла ошибка при удалении колонки",
    };
  }
}
