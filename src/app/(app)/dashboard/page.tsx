import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { api } from "@/lib/trpc/client";
import { CreateProjectForm } from "@/components/project/create-project-form";
import { ProjectCard } from "@/components/project/project-card";

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
          <h1 className="text-3xl font-bold text-foreground">My projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your tasks and projects
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}

        <CreateProjectForm />
      </div>
    </div>
  );
}
