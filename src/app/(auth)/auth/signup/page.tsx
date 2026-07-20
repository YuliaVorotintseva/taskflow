import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignupForm } from "@/components/auth/signup-form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { signInWithGithub, signInWithGoogle } from "@/app/actions/oauth";

export const metadata: Metadata = {
  title: "Log up | TaskFlow",
  description: "Create your TaskFlow account",
};

export default async function SignupPage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter registration details
          </p>
        </div>

        <SignupForm />

        <Separator />

        <div className="space-y-3">
          <form action={signInWithGithub}>
            <Button variant="outline" type="submit" className="w-full">
              Continue with GitHub
            </Button>
          </form>
          <form action={signInWithGoogle}>
            <Button variant="outline" type="submit" className="w-full">
              Continue with Google
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
