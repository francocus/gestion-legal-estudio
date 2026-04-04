import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;
        const user = await db.user.findUnique({ where: { email } });

        if (!user) {
          return null;
        }

        if (user.status === "SUSPENDED") {
          await db.userAuditLog.create({
            data: {
              userId: user.id,
              actorEmail: user.email,
              action: "LOGIN_BLOCKED",
              details: "Intento de acceso sobre una cuenta suspendida.",
            },
          });
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (!passwordsMatch) {
          await db.userAuditLog.create({
            data: {
              userId: user.id,
              actorEmail: user.email,
              action: "LOGIN_FAILED",
              details: "Intento de inicio de sesion con contraseña incorrecta.",
            },
          });
          return null;
        }

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await db.userAuditLog.create({
          data: {
            userId: user.id,
            actorEmail: user.email,
            action: "LOGIN_SUCCESS",
            details: "Inicio de sesion correcto en el sistema.",
          },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
});
