"use client";

import { useState } from "react";
import { MoreVertical, UserPlus, Crown, Shield, User, Eye } from "lucide-react";

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
import { toast } from "@/components/ui/use-toast";
import { ConfirmDialog } from "../ui/confirm-dialog";

interface MembersListProps {
  projectId: string;
  currentUserId: string;
}

const roleLabels = {
  owner: {
    label: "Owner",
    icon: Crown,
    color: "bg-yellow-100 text-yellow-800",
  },
  admin: { label: "Admin", icon: Shield, color: "bg-blue-100 text-blue-800" },
  member: {
    label: "Participant",
    icon: User,
    color: "bg-gray-100 text-gray-800",
  },
  viewer: {
    label: "Viewer",
    icon: Eye,
    color: "bg-green-100 text-green-800",
  },
};

export function MembersList({ projectId, currentUserId }: MembersListProps) {
  const utils = trpc.useUtils();
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  const { data: members } = trpc.member.getByProject.useQuery({ projectId });

  const inviteMutation = trpc.member.invite.useMutation({
    onSuccess: async () => {
      toast({ title: "Participant invited" });
      setInviteEmail("");
      await utils.member.getByProject.invalidate({ projectId });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to invite participant",
      });
    },
  });

  const updateRoleMutation = trpc.member.updateRole.useMutation({
    onSuccess: async () => {
      toast({ title: "Role updated" });
      await utils.member.getByProject.invalidate({ projectId });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.message || "The error occurred while updating the role",
      });
    },
  });

  const removeMemberMutation = trpc.member.remove.useMutation({
    onSuccess: async () => {
      toast({ title: "Participant deleted" });
      await utils.member.getByProject.invalidate({ projectId });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.message || "The error occurred while deleting participant",
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

  const removeMember = async () => {
    if (!memberToRemove) return;

    await await removeMemberMutation.mutateAsync({
      projectId,
      userId: memberToRemove,
    });
    setMemberToRemove(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Participant email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && inviteMember()}
        />
        <Button
          onClick={inviteMember}
          disabled={isInviting || !inviteEmail.trim()}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite
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
                    {member.user.name || "Unknown"}
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
                    <DropdownMenuContent align="end" className="z-[100]">
                      <DropdownMenuItem
                        onClick={() => updateRole(member.userId, "admin")}
                      >
                        Make as administrator
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateRole(member.userId, "member")}
                      >
                        Make as participant
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateRole(member.userId, "viewer")}
                      >
                        Make as viewer
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setMemberToRemove(member.userId)}
                        className="text-destructive"
                      >
                        Remove from project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        onConfirm={removeMember}
        title="Remove participant from project?"
        description="Are you sure you want to remove this member from the project? They will lose access to all tasks"
        confirmText="Delete"
        isLoading={removeMemberMutation.isPending}
      />
    </div>
  );
}
