"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { trpc } from "@/components/providers";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { data: projects } = trpc.project.getAll.useQuery();

  return (
    <aside className="w-64 border-r bg-background p-4">
      <nav className="space-y-2">
        <Link
          href="/dashboard"
          className={cn(
            "block px-3 py-2 rounded-md text-sm font-medium hover:bg-accent",
            pathname === "/dashboard" && "bg-accent",
          )}
        >
          Дашборд
        </Link>

        {projects && projects.length > 0 && (
          <>
            <div className="pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase">
              Проекты
            </div>
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/${project.slug}`}
                className={cn(
                  "block px-3 py-2 rounded-md text-sm hover:bg-accent",
                  pathname.startsWith(`/${project.slug}`) && "bg-accent",
                )}
              >
                {project.name}
              </Link>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
