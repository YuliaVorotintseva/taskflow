"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, Folder, FileText } from "lucide-react";

import { trpc } from "@/components/providers";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const { data: results } = trpc.search.global.useQuery(
    { query: search, limit: 10 },
    { enabled: search.length >= 2 },
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (value: string) => {
    setOpen(false);
    setSearch("");
    router.push(value);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50"
      onClick={() => setOpen(false)}
    >
      <div
        className="fixed left-[50%] top-[20%] z-50 w-full max-w-lg translate-x-[-50%] rounded-lg border bg-background shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 opacity-50" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search for projects and tasks... (Ctrl+/)"
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none"
              autoFocus
            />
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              {search.length < 2
                ? "Please enter at least 2 characters"
                : "Nothing found"}
            </Command.Empty>

            {results?.projects && results.projects.length > 0 && (
              <Command.Group heading="Projects" className="py-1">
                {results.projects.map((project) => (
                  <Command.Item
                    key={project.id}
                    value={project.name}
                    onSelect={() => handleSelect(`/${project.slug}`)}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent cursor-pointer"
                  >
                    <Folder className="h-4 w-4" />
                    {project.name}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results?.issues && results.issues.length > 0 && (
              <Command.Group heading="Задачи" className="py-1">
                {results.issues.map((issue) => (
                  <Command.Item
                    key={issue.id}
                    value={issue.title}
                    onSelect={() =>
                      handleSelect(`/${issue.project.slug}/issue/${issue.id}`)
                    }
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent cursor-pointer"
                  >
                    <FileText className="h-4 w-4" />
                    <div className="flex-1">
                      <div>{issue.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {issue.project.name}
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
