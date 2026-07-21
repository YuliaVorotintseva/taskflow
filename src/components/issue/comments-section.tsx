"use client";

import { useState } from "react";
import { Send, Reply, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enGB } from "date-fns/locale";

import { trpc } from "@/components/providers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { ConfirmDialog } from "../ui/confirm-dialog";

interface CommentsSectionProps {
  issueId: string;
  currentUserId: string;
}

export function CommentsSection({
  issueId,
  currentUserId,
}: CommentsSectionProps) {
  const utils = trpc.useUtils();
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const { data: comments } = trpc.comment.getByIssue.useQuery({ issueId });

  const createCommentMutation = trpc.comment.create.useMutation({
    onSuccess: async () => {
      toast({ title: "Comment added" });
      setContent("");
      setReplyTo(null);
      await utils.comment.getByIssue.invalidate({ issueId });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add comment",
      });
    },
  });

  const deleteCommentMutation = trpc.comment.delete.useMutation({
    onSuccess: async () => {
      toast({ title: "Comment deleted" });
      await utils.comment.getByIssue.invalidate({ issueId });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete comment",
      });
    },
  });

  const handleSubmit = async () => {
    if (!content.trim()) return;

    await createCommentMutation.mutateAsync({
      issueId,
      content,
      parentId: replyTo || undefined,
    });
  };

  const handleDelete = async () => {
    if (!commentToDelete) return;

    await deleteCommentMutation.mutateAsync({ commentId: commentToDelete });
    setCommentToDelete(null);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Comments ({comments?.length || 0})</h3>

      <div className="space-y-3">
        {comments?.map((comment) => (
          <Card key={comment.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user.image || undefined} />
                  <AvatarFallback>
                    {comment.user.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {comment.user.name || "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: enGB,
                      })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {comment.content}
                  </p>

                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => setReplyTo(comment.id)}
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Answer
                    </Button>
                    {comment.userId === currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-destructive"
                        onClick={() => setCommentToDelete(comment.id)}
                        disabled={deleteCommentMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>

                  {comment.replies.length > 0 && (
                    <div className="mt-3 ml-4 space-y-2 border-l-2 pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={reply.user.image || undefined} />
                            <AvatarFallback className="text-xs">
                              {reply.user.name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-xs">
                                {reply.user.name || "Unknown"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(
                                  new Date(reply.createdAt),
                                  { addSuffix: true, locale: enGB },
                                )}
                              </span>
                            </div>
                            <p className="text-xs whitespace-pre-wrap">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback>You</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex justify-end gap-2 mt-2">
            {replyTo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(null)}
              >
                Cancel the answer
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={createCommentMutation.isPending || !content.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              {createCommentMutation.isPending ? "..." : "Send"}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!commentToDelete}
        onOpenChange={(open) => !open && setCommentToDelete(null)}
        onConfirm={handleDelete}
        title="Delete the comment?"
        description="Are you sure you want to delete this comment? This action cannot be undone"
        confirmText="Delete"
        isLoading={deleteCommentMutation.isPending}
      />
    </div>
  );
}
