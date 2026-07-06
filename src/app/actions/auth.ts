'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';
import { users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth-utils';

const signupSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
});

const signinSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
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

export async function signup(
  formData: FormData
): Promise<SignupResult> {
  const validatedFields = signupSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = validatedFields.data;

  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return {
        success: false,
        error: 'Пользователь с таким email уже существует',
      };
    }

    const hashedPassword = await hashPassword(password);

    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
    });

    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      success: false,
      error: 'Произошла ошибка при регистрации',
    };
  }
}

export async function signin(
  formData: FormData
): Promise<SigninResult> {
  const validatedFields = signinSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return {
            success: false,
            error: 'Неверный email или пароль',
          };
        default:
          return {
            success: false,
            error: 'Произошла ошибка при входе',
          };
      }
    }
    throw error;
  }
}