import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function ProjectNotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Проект не найден</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The project you are looking for does not exist or you do not have
            access to it.
          </p>
          <div className="flex gap-2">
            <Link href="/dashboard" className={cn(buttonVariants.default)}>
              Return to dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
