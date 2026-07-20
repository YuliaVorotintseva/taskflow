"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and, desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { columns, projects } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

const createColumnSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1, "Title is required").max(50),
  projectSlug: z.string(),
});

const updateColumnSchema = z.object({
  columnId: z.string().uuid(),
  projectId: z.string().uuid(),
  projectSlug: z.string(),
  name: z.string().min(1, "Title is required").max(50),
});

const authorizationRequiredError = {
  success: false,
  error: "Authorization required",
};

export async function createColumn(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Authorization required" };
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
        "Validation error",
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
      return { success: false, error: "Project is not found" };
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
      error: "An error occurred while creating the column",
    };
  }
}

export async function updateColumn(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return authorizationRequiredError;
  }

  const validatedFields = updateColumnSchema.safeParse({
    columnId: formData.get("columnId"),
    projectId: formData.get("projectId"),
    projectSlug: formData.get("projectSlug"),
    name: formData.get("name"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      error:
        validatedFields.error.flatten().fieldErrors.name?.[0] ||
        "Validation error",
    };
  }

  const { columnId, projectSlug, name } = validatedFields.data;

  try {
    const column = await db.query.columns.findFirst({
      where: eq(columns.id, columnId),
      with: { project: true },
    });

    if (!column || column.project.userId !== session.user.id) {
      return { success: false, error: "Column is not found" };
    }

    await db.update(columns).set({ name }).where(eq(columns.id, columnId));

    revalidatePath(`/${projectSlug}`);

    return { success: true };
  } catch (error) {
    console.error("Update column error:", error);
    return {
      success: false,
      error: "An error occurred while updating the column",
    };
  }
}

export async function deleteColumn(columnId: string, projectSlug: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return authorizationRequiredError;
  }

  try {
    const column = await db.query.columns.findFirst({
      where: eq(columns.id, columnId),
      with: { project: true },
    });

    if (!column || column.project.userId !== session.user.id) {
      return authorizationRequiredError;
    }

    await db.delete(columns).where(eq(columns.id, columnId));

    revalidatePath(`/${projectSlug}`);

    return { success: true };
  } catch (error) {
    console.error("Delete column error:", error);
    return {
      success: false,
      error: "An error occurred while removing the column",
    };
  }
}
