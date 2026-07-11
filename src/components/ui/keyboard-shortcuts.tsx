"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "g") {
        setTimeout(() => {
          const handler = (e2: KeyboardEvent) => {
            if (e2.key === "d") {
              router.push("/dashboard");
            }
          };
          document.addEventListener("keydown", handler, { once: true });
        }, 100);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router, pathname]);

  return null;
}
