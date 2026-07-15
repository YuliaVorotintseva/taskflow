"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, LayoutDashboard } from "lucide-react";

import { trpc } from "@/components/providers";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { data: projects } = trpc.project.getAll.useQuery();

  return (
    <aside className="w-64 border-r bg-white/50 backdrop-blur-sm p-4 overflow-y-auto">
      <nav className="space-y-1">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
            pathname === "/dashboard"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "hover:bg-accent text-foreground",
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Дашборд
        </Link>

        {projects && projects.length > 0 && (
          <>
            <div className="pt-4 pb-2 px-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <FolderKanban className="h-3 w-3" />
                Проекты
              </div>
            </div>
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/${project.slug}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                  pathname.startsWith(`/${project.slug}`)
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-accent text-foreground",
                )}
              >
                <div className="h-2 w-2 rounded-full bg-primary/60" />
                {project.name}
              </Link>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
