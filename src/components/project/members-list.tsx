"use client";

import { useState } from "react";
import { trpc } from "@/components/providers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, UserPlus, Crown, Shield, User, Eye } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface MembersListProps {
  projectId: string;
  currentUserId: string;
}

const roleLabels = {
  owner: {
    label: "Владелец",
    icon: Crown,
    color: "bg-yellow-100 text-yellow-800",
  },
  admin: { label: "Админ", icon: Shield, color: "bg-blue-100 text-blue-800" },
  member: { label: "Участник", icon: User, color: "bg-gray-100 text-gray-800" },
  viewer: {
    label: "Наблюдатель",
    icon: Eye,
    color: "bg-green-100 text-green-800",
  },
};

export function MembersList({ projectId, currentUserId }: MembersListProps) {
  const utils = trpc.useUtils();
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const { data: members } = trpc.member.getByProject.useQuery({ projectId });

  const inviteMutation = trpc.member.invite.useMutation({
    onSuccess: async () => {
      toast({ title: "Участник приглашён" });
      setInviteEmail("");
      await utils.member.getByProject.invalidate({ projectId });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось пригласить участника",
      });
    },
  });

  const updateRoleMutation = trpc.member.updateRole.useMutation({
    onSuccess: async () => {
      toast({ title: "Роль обновлена" });
      await utils.member.getByProject.invalidate({ projectId });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось обновить роль",
      });
    },
  });

  const removeMemberMutation = trpc.member.remove.useMutation({
    onSuccess: async () => {
      toast({ title: "Участник удалён" });
      await utils.member.getByProject.invalidate({ projectId });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось удалить участника",
      });
    },
  });

  const inviteMember = async () => {
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      await inviteMutation.mutateAsync({
        projectId,
        email: inviteEmail,
        role: "member",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const updateRole = async (
    userId: string,
    role: "admin" | "member" | "viewer",
  ) => {
    await await updateRoleMutation.mutateAsync({ projectId, userId, role });
  };

  const removeMember = async (userId: string) => {
    if (!confirm("Вы уверены, что хотите удалить участника?")) return;

    await await removeMemberMutation.mutateAsync({ projectId, userId });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Email участника"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && inviteMember()}
        />
        <Button
          onClick={inviteMember}
          disabled={isInviting || !inviteEmail.trim()}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Пригласить
        </Button>
      </div>

      <div className="space-y-2">
        {members?.map((member) => {
          const roleInfo = roleLabels[member.role as keyof typeof roleLabels];
          const RoleIcon = roleInfo.icon;

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.user.image || undefined} />
                  <AvatarFallback>
                    {member.user.name?.[0] || member.user.email?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">
                    {member.user.name || "Без имени"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {member.user.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={roleInfo.color}>
                  <RoleIcon className="h-3 w-3 mr-1" />
                  {roleInfo.label}
                </Badge>

                {member.userId !== currentUserId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => updateRole(member.userId, "admin")}
                      >
                        Сделать администратором
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateRole(member.userId, "member")}
                      >
                        Сделать участником
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateRole(member.userId, "viewer")}
                      >
                        Сделать наблюдателем
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => removeMember(member.userId)}
                        className="text-destructive"
                      >
                        Удалить из проекта
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
