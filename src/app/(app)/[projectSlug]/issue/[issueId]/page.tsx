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
  const issue = await data.issue.getById({
    id: issueId,
  });
  console.log(projectSlug);
  console.log(issueId);
  console.log(issue);

  if (!issue) {
    return null;
  }

  return <IssuePage issue={issue} projectSlug={projectSlug} />;
}
