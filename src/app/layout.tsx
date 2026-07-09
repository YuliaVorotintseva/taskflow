import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TRPCProvider } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { CommandPalette } from "@/components/command-palette";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TaskFlow",
  description: "Advanced Kanban Board",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <TRPCProvider>
          {children}
          <Toaster />
          <CommandPalette />
        </TRPCProvider>
      </body>
    </html>
  );
}
