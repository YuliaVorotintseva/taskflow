"use server";

import { z } from "zod";
import { AuthError } from "next-auth";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth-utils";
import { signIn } from "@/lib/auth";

const signupSchema = z.object({
  name: z.string().min(2, "The name must contain at least 2 characters"),
  email: z.string().email("Incorrect email"),
  password: z
    .string()
    .min(6, "The password must contain at least 6 characters"),
});

const signinSchema = z.object({
  email: z.string().email("Incollect email"),
  password: z.string().min(1, "Enter your password"),
});

const registerError = {
  success: false,
  error: "An error occurred while registering",
};

const existingEmailError = {
  success: false,
  error: "A user with this email already exists",
};

const incorrectEmailOrPasswordError = {
  success: false,
  error: "Incorrect email or password",
};

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
      return existingEmailError;
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
        error: "Automatic login error. Please log in manually",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Signup error:", error);

    if (error instanceof Error && error.message.includes("unique")) {
      return existingEmailError;
    }

    return registerError;
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
      return incorrectEmailOrPasswordError;
    }

    return { success: true };
  } catch (error) {
    console.error("Signin error:", error);

    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return incorrectEmailOrPasswordError;
        default:
          return registerError;
      }
    }

    return registerError;
  }
}
