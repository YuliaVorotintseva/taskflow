"use client";

import { useQueryState } from "nuqs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SidebarFiltersProps {
  projectId: string;
}

export function SidebarFilters({ projectId }: SidebarFiltersProps) {
  const [search, setSearch] = useQueryState("search");
  const [priority, setPriority] = useQueryState("priority");

  return (
    <div className="w-64 border-r p-4 space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Фильтры</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="search">Поиск</Label>
            <Input
              id="search"
              placeholder="Название задачи..."
              value={search || ""}
              onChange={(e) => setSearch(e.target.value || null)}
            />
          </div>

          <div>
            <Label>Приоритет</Label>
            <div className="space-y-2 mt-2">
              {["low", "medium", "high"].map((p) => (
                <Button
                  key={p}
                  variant={priority === p ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setPriority(priority === p ? null : p)}
                >
                  {p === "low" && "Низкий"}
                  {p === "medium" && "Средний"}
                  {p === "high" && "Высокий"}
                </Button>
              ))}
            </div>
          </div>

          {(search || priority) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch(null);
                setPriority(null);
              }}
            >
              Сбросить фильтры
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
