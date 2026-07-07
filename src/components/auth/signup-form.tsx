"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { signup } from "@/app/actions/auth";
import { toast } from "@/components/ui/use-toast";

const signupSchema = z
  .object({
    name: z.string().min(2, "Имя должно содержать минимум 2 символа"),
    email: z.string().email("Некорректный email"),
    password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(data: SignupFormValues) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("password", data.password);

      const result = await signup(formData);

      if (result.success) {
        toast({
          title: "Регистрация успешна",
          description: "Добро пожаловать в TaskFlow!",
        });

        router.refresh();

        setTimeout(() => {
          router.push("/dashboard");
        }, 100);
      } else {
        toast({
          variant: "destructive",
          title: "Ошибка регистрации",
          description: result.error || "Произошла ошибка",
        });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Имя</FormLabel>
              <FormControl>
                <Input
                  placeholder="Иван Иванов"
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
              <FormLabel>Пароль</FormLabel>
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
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Подтвердите пароль</FormLabel>
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
          {isPending ? "Регистрация..." : "Зарегистрироваться"}
        </Button>
        <div className="text-center text-sm">
          Уже есть аккаунт?{" "}
          <Link href="/auth/signin" className="underline hover:text-primary">
            Войти
          </Link>
        </div>
      </form>
    </Form>
  );
}
