export type IssueMetadata = {
  estimate?: number;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  labels?: string[];
};
