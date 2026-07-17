import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { api } from "@/lib/trpc/client";
import { IssueModal } from "@/components/issue/issue-modal";

export default async function IssueModalPage({
  params,
}: {
  params: Promise<{ projectSlug: string; issueId: string }>;
}) {
  const session = await auth();

  if (!session) {
    return null;
  }

  const { projectSlug, issueId } = await params;
  const data = await api();

  let issue;
  try {
    issue = await data.issue.getById({ id: issueId });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("не найдена")) {
      redirect(`/${projectSlug}`);
    }

    console.error("Error loading issue:", error);
    return null;
  }

  if (!issue) {
    redirect(`/${projectSlug}`);
  }

  return (
    <IssueModal
      issue={issue}
      projectSlug={projectSlug}
      currentUserId={session.user?.id || ""}
    />
  );
}
