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
  const issue = await data.issue.getById({
    id: issueId,
  });

  if (!issue) {
    return null;
  }

  return <IssueModal issue={issue} projectSlug={projectSlug} />;
}
