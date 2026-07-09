import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { api } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateProjectForm } from "@/components/project/create-project-form";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const data = await api();
  const projects = await data.project.getAll();

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Мои проекты</h1>
          <p className="text-muted-foreground mt-1">
            Управляйте своими задачами и проектами
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link key={project.id} href={`/${project.slug}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-lg">{project.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {project.description}
                  </p>
                )}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>/{project.slug}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        <CreateProjectForm />
      </div>
    </div>
  );
}
