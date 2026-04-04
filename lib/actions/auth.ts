"use server";

import { auth, signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { AuthError } from "next-auth";

export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      ...Object.fromEntries(formData),
      redirect: false,
    });

    return "success";
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Credenciales invalidas.";
        default:
          return "Algo salio mal.";
      }
    }

    throw error;
  }
}

export async function logout() {
  const session = await auth();
  if (session?.user?.email) {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true },
    });

    if (user) {
      await db.userAuditLog.create({
        data: {
          userId: user.id,
          actorEmail: user.email,
          action: "LOGOUT",
          details: "Cierre de sesion manual desde la interfaz.",
        },
      });
    }
  }

  await signOut({ redirectTo: "/login" });
}

export async function switchUser() {
  const session = await auth();
  if (session?.user?.email) {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true },
    });

    if (user) {
      await db.userAuditLog.create({
        data: {
          userId: user.id,
          actorEmail: user.email,
          action: "SWITCH_USER",
          details: "Cambio de usuario solicitado desde la barra superior.",
        },
      });
    }
  }

  await signOut({ redirectTo: "/switch-user" });
}
