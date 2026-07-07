import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { api } from "@/lib/trpc/client";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const data = await api();
  const projects = await data.project.getAll();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="mb-4">Welcome, {session.user?.name}!</p>

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <p className="text-muted-foreground">
            No projects yet. Create your first project!
          </p>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold">{project.name}</h2>
              <p className="text-sm text-muted-foreground">
                {project.description}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
