"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { signin } from "@/app/actions/auth";
import { toast } from "@/components/ui/use-toast";

const signinSchema = z.object({
  email: z.string().email("Incorrect email"),
  password: z.string().min(1, "Enter your password"),
});

type SigninFormValues = z.infer<typeof signinSchema>;

export function SigninForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [isPending, startTransition] = useTransition();

  const form = useForm<SigninFormValues>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(data: SigninFormValues) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);

      const result = await signin(formData);

      if (result.success) {
        toast({
          title: "Successful login",
          description: "Welcome!",
        });

        router.push(callbackUrl);
        router.refresh();

        setTimeout(() => {
          router.push("/dashboard");
        }, 100);
      } else {
        toast({
          variant: "destructive",
          title: "Login error",
          description: result.error || "An error occurred",
        });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="your@email.com"
                  type="email"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  placeholder="••••••••"
                  type="password"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "..." : "Log in"}
        </Button>
        <div className="text-center text-sm">
          Do not have an account?{" "}
          <Link href="/auth/signup" className="underline hover:text-primary">
            Register
          </Link>
        </div>
      </form>
    </Form>
  );
}
