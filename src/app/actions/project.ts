"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

import { db } from "@/lib/db";
import { projects, columns, projectMembers } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

const createProjectSchema = z.object({
  name: z.string().min(1, "Title is required").max(100),
  slug: z
    .string()
    .min(3, "The slug must contain at least 3 characters")
    .max(50, "The slug must contain maximum 50 characters")
    .regex(/^[a-z0-9-]+$/, "Only latin letters, numbers and hyphens"),
  description: z.string().max(500).optional(),
});

const updateProjectSchema = z.object({
  projectId: z.string().uuid(),
  currentSlug: z.string(),
  name: z.string().min(1, "Title is required").max(100),
  slug: z
    .string()
    .min(3, "The slug must contain at least 3 characters")
    .max(50, "The slug must contain maximum 50 characters")
    .regex(/^[a-z0-9-]+$/, "Only latin letters, numbers and hyphens"),
  description: z.string().max(500).optional(),
});

const authorizationRequiredError = {
  success: false,
  error: "Authorization required",
};

const sameUrlError = {
  success: false,
  error: "A project with this URL already exists",
};

const projectIsNotFoundError = {
  success: false,
  error: "Project is not found",
};

export type CreateProjectResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  projectSlug?: string;
};

export type UpdateProjectResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  newSlug?: string;
};

export async function createProject(
  formData: FormData,
): Promise<CreateProjectResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return authorizationRequiredError;
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
      return sameUrlError;
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

    await db.insert(projectMembers).values({
      projectId: project.id,
      userId: session.user.id,
      role: "owner",
      joinedAt: new Date(),
    });

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
      error: "An error occurred while creating the project",
    };
  }
}

export async function updateProject(
  formData: FormData,
): Promise<UpdateProjectResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return authorizationRequiredError;
  }

  const validatedFields = updateProjectSchema.safeParse({
    projectId: formData.get("projectId"),
    currentSlug: formData.get("currentSlug"),
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

  const { projectId, currentSlug, name, slug, description } =
    validatedFields.data;

  try {
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.userId, session.user.id),
      ),
    });

    if (!project) {
      return projectIsNotFoundError;
    }

    if (slug !== currentSlug) {
      const existingProject = await db.query.projects.findFirst({
        where: and(
          eq(projects.slug, slug),
          eq(projects.userId, session.user.id),
        ),
      });

      if (existingProject) {
        return sameUrlError;
      }
    }

    await db
      .update(projects)
      .set({
        name,
        slug,
        description: description || null,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    revalidatePath("/dashboard");
    revalidatePath("/", "layout");
    revalidatePath(`/${currentSlug}`);
    revalidatePath(`/${slug}`);

    return {
      success: true,
      newSlug: slug !== currentSlug ? slug : undefined,
    };
  } catch (error) {
    console.error("Update project error:", error);
    return {
      success: false,
      error: "An error occurred while updating the project",
    };
  }
}

export async function deleteProject(projectId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return authorizationRequiredError;
  }

  try {
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.userId, session.user.id),
      ),
    });

    if (!project) {
      return projectIsNotFoundError;
    }

    await db.delete(projects).where(eq(projects.id, projectId));

    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Delete project error:", error);
    return {
      success: false,
      error: "An error occurred while removing the project",
    };
  }
}
