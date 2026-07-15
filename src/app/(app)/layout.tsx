import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
      <Header user={session.user!} />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 flex overflow-hidden w-full">{children}</main>
      </div>
    </div>
  );
}
