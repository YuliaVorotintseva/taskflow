"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { eq, and } from "drizzle-orm";

import { db } from "@/lib/db";
import { projects, columns } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

const createProjectSchema = z.object({
  name: z.string().min(1, "Название обязательно").max(100),
  slug: z
    .string()
    .min(3, "Минимум 3 символа")
    .max(50, "Максимум 50 символов")
    .regex(/^[a-z0-9-]+$/, "Только латинские буквы, цифры и дефис"),
  description: z.string().max(500).optional(),
});

export type CreateProjectResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  projectSlug?: string;
};

export async function createProject(
  formData: FormData,
): Promise<CreateProjectResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Необходима авторизация" };
  }

  const validatedFields = createProjectSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, slug, description } = validatedFields.data;

  try {
    const existingProject = await db.query.projects.findFirst({
      where: and(eq(projects.slug, slug), eq(projects.userId, session.user.id)),
    });

    if (existingProject) {
      return {
        success: false,
        error: "Проект с таким URL уже существует",
      };
    }

    const [project] = await db
      .insert(projects)
      .values({
        userId: session.user.id,
        name,
        slug,
        description: description || null,
      })
      .returning();

    const defaultColumns = ["Backlog", "Todo", "In Progress", "Done"];
    const columnData = defaultColumns.map((colName, index) => ({
      projectId: project.id,
      name: colName,
      position: index,
    }));

    await db.insert(columns).values(columnData);

    revalidatePath("/dashboard");

    return { success: true, projectSlug: project.slug };
  } catch (error) {
    console.error("Create project error:", error);
    return {
      success: false,
      error: "Произошла ошибка при создании проекта",
    };
  }
}

export async function deleteProject(projectId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Необходима авторизация" };
  }

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

    await db.delete(projects).where(eq(projects.id, projectId));

    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Delete project error:", error);
    return {
      success: false,
      error: "Произошла ошибка при удалении проекта",
    };
  }
}
