"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth-utils";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

const signupSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});

const signinSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export type SignupResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export type SigninResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function signup(formData: FormData): Promise<SignupResult> {
  const validatedFields = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = validatedFields.data;

  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser && existingUser.length > 0) {
      return {
        success: false,
        error: "Пользователь с таким email уже существует",
      };
    }

    const hashedPassword = await hashPassword(password);

    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
    });

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return {
        success: false,
        error: "Ошибка автоматического входа. Пожалуйста, войдите вручную.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Signup error:", error);

    if (error instanceof Error && error.message.includes("unique")) {
      return {
        success: false,
        error: "Пользователь с таким email уже существует",
      };
    }

    return {
      success: false,
      error: "Произошла ошибка при регистрации",
    };
  }
}

export async function signin(formData: FormData): Promise<SigninResult> {
  const validatedFields = signinSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return {
        success: false,
        error: "Неверный email или пароль",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Signin error:", error);

    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            error: "Неверный email или пароль",
          };
        default:
          return {
            success: false,
            error: "Произошла ошибка при входе",
          };
      }
    }

    return {
      success: false,
      error: "Произошла ошибка при входе",
    };
  }
}
