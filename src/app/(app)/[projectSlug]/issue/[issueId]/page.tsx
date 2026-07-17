import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { api } from "@/lib/trpc/client";
import { IssuePage } from "@/components/issue/issue-page";

export default async function IssueFullPage({
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
  } catch (error) {
    if (error instanceof Error && error.message.includes("не найдена")) {
      redirect(`/${projectSlug}`);
    }

    console.error("Error loading issue:", error);
    return null;
  }

  if (!issue) {
    redirect(`/${projectSlug}`);
  }

  return <IssuePage issue={issue} projectSlug={projectSlug} />;
}
