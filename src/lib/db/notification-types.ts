export type ProjectInvitedMetadata = {
  type: "project_invited";
  projectId: string;
  invitedBy: string;
};

export type IssueCommentedMetadata = {
  type: "issue_commented";
  issueId: string;
  commentId: string;
};

export type IssueAssignedMetadata = {
  type: "issue_assigned";
  issueId: string;
  assignedBy: string;
};

export type IssueMovedMetadata = {
  type: "issue_moved";
  issueId: string;
  fromColumnId: string;
  toColumnId: string;
  movedBy: string;
};

export type NotificationMetadata =
  | ProjectInvitedMetadata
  | IssueCommentedMetadata
  | IssueAssignedMetadata
  | IssueMovedMetadata;
