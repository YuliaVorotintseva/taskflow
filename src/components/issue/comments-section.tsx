"use client";

import { useState } from "react";
import { trpc } from "@/components/providers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Reply, Edit2, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

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

  const { data: comments } = trpc.comment.getByIssue.useQuery({ issueId });

  const createCommentMutation = trpc.comment.create.useMutation({
    onSuccess: async () => {
      toast({ title: "Комментарий добавлен" });
      setContent("");
      setReplyTo(null);
      await utils.comment.getByIssue.invalidate({ issueId });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось добавить комментарий",
      });
    },
  });

  const deleteCommentMutation = trpc.comment.delete.useMutation({
    onSuccess: async () => {
      toast({ title: "Комментарий удалён" });
      await utils.comment.getByIssue.invalidate({ issueId });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось удалить комментарий",
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

  const handleDelete = async (commentId: string) => {
    if (!confirm("Удалить комментарий?")) return;

    await deleteCommentMutation.mutateAsync({ commentId });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Комментарии ({comments?.length || 0})</h3>

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
                      {comment.user.name || "Аноним"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: ru,
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
                      Ответить
                    </Button>
                    {comment.userId === currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-destructive"
                        onClick={() => handleDelete(comment.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Удалить
                      </Button>
                    )}
                  </div>

                  {/* Ответы */}
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
                                {reply.user.name || "Аноним"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(
                                  new Date(reply.createdAt),
                                  { addSuffix: true, locale: ru },
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

      {/* Форма добавления комментария */}
      <div className="flex gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback>Вы</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder={
              replyTo ? "Написать ответ..." : "Написать комментарий..."
            }
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
                Отмена ответа
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={createCommentMutation.isPending || !content.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              {createCommentMutation.isPending ? "Отправка..." : "Отправить"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
