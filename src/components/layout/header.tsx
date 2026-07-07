"use client";

import Link from "next/link";
import { User } from "next-auth";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

interface HeaderProps {
  user: User;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-6">
      <Link href="/dashboard" className="text-xl font-bold">
        TaskFlow
      </Link>

      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{user.email}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        >
          Выйти
        </Button>
      </div>
    </header>
  );
}
