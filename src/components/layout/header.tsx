"use client";

import Link from "next/link";
import { User } from "next-auth";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

interface HeaderProps {
  user: User;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="h-16 border-b bg-white/95 background-blur-sm flex items-center justify-between px-6 soft-shadow">
      <Link
        href="/dashboard"
        className="text-xl font-bold text-primary hover:opacity-80 transition-opacity"
      >
        TaskFlow
      </Link>

      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{user.email}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Выйти
        </Button>
      </div>
    </header>
  );
}
