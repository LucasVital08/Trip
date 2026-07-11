"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { formValues } from "@/lib/form-values";
import { signIn, signOut } from "@/lib/auth";

export interface ActionState {
  error?: string;
  ok?: boolean;
  /** valores enviados, devolvidos em caso de erro para repopular o form */
  values?: Record<string, string>;
}

const registerSchema = z.object({
  name: z.string().trim().min(3, "Informe seu nome completo.").max(120),
  email: z.email("E-mail inválido."),
  password: z.string().min(6, "A senha precisa de pelo menos 6 caracteres.").max(72),
});

export async function registerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: String(formData.get("email") ?? "").toLowerCase().trim(),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, values: formValues(formData, ["password"]) };
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Já existe uma conta com este e-mail. Faça login.", values: formValues(formData, ["password"]) };

  await prisma.user.create({
    data: { name, email, passwordHash: await hash(password, 10) },
  });

  await signIn("credentials", { email, password, redirect: false });
  redirect("/");
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "") || "/";
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "E-mail ou senha incorretos.", values: formValues(formData, ["password"]) };
    }
    throw err;
  }
  redirect(callbackUrl.startsWith("/") ? callbackUrl : "/");
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirect: false });
  redirect("/");
}

export async function googleLoginAction(): Promise<void> {
  await signIn("google", { redirectTo: "/" });
}
