import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SigninForm } from "@/components/auth/signin-form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { signInWithGithub, signInWithGoogle } from "@/app/actions/oauth";

export const metadata: Metadata = {
  title: "Вход | TaskFlow",
  description: "Войдите в свой аккаунт TaskFlow",
};

export default async function SigninPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();

  if (session) {
    const { callbackUrl } = await searchParams;
    redirect(callbackUrl || "/dashboard");
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Добро пожаловать
          </h1>
          <p className="text-sm text-muted-foreground">
            Войдите в свой аккаунт
          </p>
        </div>

        <SigninForm />

        <Separator />

        <div className="space-y-3">
          <form action={signInWithGithub}>
            <Button variant="outline" type="submit" className="w-full">
              Продолжить с GitHub
            </Button>
          </form>
          <form action={signInWithGoogle}>
            <Button variant="outline" type="submit" className="w-full">
              Продолжить с Google
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
