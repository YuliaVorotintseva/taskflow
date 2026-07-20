"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and, desc, sql, asc } from "drizzle-orm";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { activities, columns, issues, projects } from "@/lib/db/schema";
import { IssueMetadata } from "@/lib/db/issue-types";

const prioritySchema = z.enum(["low", "medium", "high"]);

const createIssueSchema = z.object({
  projectId: z.string().uuid(),
  columnId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional(),
  priority: prioritySchema.optional(),
  projectSlug: z.string(),
});

const updateIssueSchema = z.object({
  issueId: z.string().uuid(),
  projectId: z.string().uuid(),
  projectSlug: z.string(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(10000).optional().nullable(),
  priority: prioritySchema.optional().nullable(),
  columnId: z.string().uuid().optional(),
});

const moveIssueSchema = z.object({
  issueId: z.string().uuid(),
  projectId: z.string().uuid(),
  projectSlug: z.string(),
  fromColumnId: z.string().uuid(),
  toColumnId: z.string().uuid(),
  newPosition: z.number().int().min(0),
});

const authorizationRequiredError = {
  success: false,
  error: "Authorization required",
};

const issueIsNotFoundError = { success: false, error: "Issue is not found" };

export async function createIssue(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return authorizationRequiredError;
  }

  const validatedFields = createIssueSchema.safeParse({
    projectId: formData.get("projectId"),
    columnId: formData.get("columnId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    priority: formData.get("priority") || undefined,
    projectSlug: formData.get("projectSlug"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      error:
        validatedFields.error.flatten().fieldErrors.title?.[0] ||
        "Validation error",
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
      return { success: false, error: "Project is not found" };
    }

    const lastIssue = await db.query.issues.findFirst({
      where: eq(issues.columnId, columnId),
      orderBy: [desc(issues.position)],
    });

    const newPosition = lastIssue ? lastIssue.position + 1 : 0;

    const metadata: IssueMetadata = priority ? { priority } : {};

    const [newIssue] = await db
      .insert(issues)
      .values({
        projectId,
        columnId,
        title,
        description: description || null,
        metadata,
        position: newPosition,
      })
      .returning();

    const column = await db.query.columns.findFirst({
      where: eq(columns.id, columnId),
    });

    await db.insert(activities).values({
      projectId,
      userId: session.user.id,
      action: "created",
      entityType: "issue",
      entityId: newIssue.id,
      metadata: {
        title,
        columnId,
        columnName: column?.name || "Unknown",
      },
    });

    revalidatePath(`/${projectSlug}`);

    return { success: true, issueId: newIssue.id };
  } catch (error) {
    console.error("Create issue error:", error);
    return {
      success: false,
      error: "An error occurred while creating the issue",
    };
  }
}

export async function updateIssue(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return authorizationRequiredError;
  }

  const validatedFields = updateIssueSchema.safeParse({
    issueId: formData.get("issueId"),
    projectId: formData.get("projectId"),
    projectSlug: formData.get("projectSlug"),
    title: formData.get("title") || undefined,
    description: formData.get("description"),
    priority: formData.get("priority") || undefined,
    columnId: formData.get("columnId") || undefined,
  });

  if (!validatedFields.success) {
    return authorizationRequiredError;
  }

  const { issueId, projectId, projectSlug, title, description, priority } =
    validatedFields.data;

  try {
    const issue = await db.query.issues.findFirst({
      where: eq(issues.id, issueId),
    });

    if (!issue) {
      return issueIsNotFoundError;
    }

    const updateData: {
      updatedAt: Date;
      title?: string;
      description?: string | null;
      metadata?: IssueMetadata;
    } = { updatedAt: new Date() };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    const cleanPriority = priority ?? undefined;
    if (cleanPriority !== undefined) {
      const currentMetadata: IssueMetadata =
        (issue.metadata as IssueMetadata) || {};
      updateData.metadata = {
        ...currentMetadata,
        priority: cleanPriority,
      };
    }

    await db.update(issues).set(updateData).where(eq(issues.id, issueId));

    await db.insert(activities).values({
      projectId,
      userId: session.user.id,
      action: "updated",
      entityType: "issue",
      entityId: issueId,
      metadata: {
        title: title || issue.title,
      },
    });

    revalidatePath(`/${projectSlug}`);
    revalidatePath(`/${projectSlug}/issue/${issueId}`);

    return { success: true };
  } catch (error) {
    console.error("Update issue error:", error);
    return {
      success: false,
      error: "An error occurred while updating the issue",
    };
  }
}

export async function moveIssue(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return authorizationRequiredError;
  }

  const validatedFields = moveIssueSchema.safeParse({
    issueId: formData.get("issueId"),
    projectId: formData.get("projectId"),
    projectSlug: formData.get("projectSlug"),
    fromColumnId: formData.get("fromColumnId"),
    toColumnId: formData.get("toColumnId"),
    newPosition: Number(formData.get("newPosition")),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Validation error",
    };
  }

  const {
    issueId,
    projectId,
    projectSlug,
    fromColumnId,
    toColumnId,
    newPosition,
  } = validatedFields.data;

  try {
    const issue = await db.query.issues.findFirst({
      where: eq(issues.id, issueId),
    });

    if (!issue) {
      return issueIsNotFoundError;
    }

    const [fromColumn, toColumn] = await Promise.all([
      db.query.columns.findFirst({ where: eq(columns.id, fromColumnId) }),
      db.query.columns.findFirst({ where: eq(columns.id, toColumnId) }),
    ]);

    await db
      .update(issues)
      .set({
        columnId: toColumnId,
        position: newPosition,
        updatedAt: new Date(),
      })
      .where(eq(issues.id, issueId));

    const targetIssues = await db.query.issues.findMany({
      where: and(
        eq(issues.columnId, toColumnId),
        sql`${issues.id} != ${issueId}`,
      ),
      orderBy: [asc(issues.position)],
    });

    const reindexPromises: Promise<unknown>[] = [];
    let currentIndex = 0;

    for (let i = 0; i < targetIssues.length; i++) {
      if (i === newPosition) {
        reindexPromises.push(
          db
            .update(issues)
            .set({ position: currentIndex })
            .where(eq(issues.id, issueId)),
        );
        currentIndex++;
      }
      reindexPromises.push(
        db
          .update(issues)
          .set({ position: currentIndex })
          .where(eq(issues.id, targetIssues[i].id)),
      );
      currentIndex++;
    }

    if (newPosition >= targetIssues.length) {
      reindexPromises.push(
        db
          .update(issues)
          .set({ position: currentIndex })
          .where(eq(issues.id, issueId)),
      );
    }

    await Promise.all(reindexPromises);

    if (fromColumnId !== toColumnId) {
      await db.insert(activities).values({
        projectId,
        userId: session.user.id,
        action: "moved",
        entityType: "issue",
        entityId: issueId,
        metadata: {
          fromColumnId,
          fromColumnName: fromColumn?.name || "Unknown",
          toColumnId,
          toColumnName: toColumn?.name || "Unknown",
          title: issue.title,
        },
      });
    }

    revalidatePath(`/${projectSlug}`);

    return { success: true };
  } catch (error) {
    console.error("Move issue error:", error);
    return {
      success: false,
      error: "An error occurred while moving the issue",
    };
  }
}

export async function deleteIssue(issueId: string, projectSlug: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return authorizationRequiredError;
  }

  try {
    const issue = await db.query.issues.findFirst({
      where: eq(issues.id, issueId),
      with: { project: true },
    });

    if (!issue || issue.project.userId !== session.user.id) {
      return issueIsNotFoundError;
    }

    await db.delete(issues).where(eq(issues.id, issueId));

    await db.insert(activities).values({
      projectId: issue.projectId,
      userId: session.user.id,
      action: "deleted",
      entityType: "issue",
      entityId: issueId,
      metadata: {
        title: issue.title,
      },
    });

    revalidatePath(`/${projectSlug}`);

    return { success: true };
  } catch (error) {
    console.error("Delete issue error:", error);
    return {
      success: false,
      error: "An error occurred while removing the issue",
    };
  }
}
