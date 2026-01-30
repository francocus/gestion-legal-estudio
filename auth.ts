import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// ... imports anteriores ...

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        console.log("🔐 Intentando iniciar sesión...");

        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          
          const user = await db.user.findUnique({ where: { email } });
          if (!user) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);
          
          if (passwordsMatch) {
            console.log("✅ Contraseña correcta. Generando Pase VIP...");
            
            // 🚨 CAMBIO IMPORTANTE ACÁ:
            // No devolvemos 'user' entero porque tiene Fechas (Date) que rompen la cookie.
            // Devolvemos un objeto limpio y simple:
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                // Agregamos cualquier otro dato SIMPLE (texto/numero) que necesites
            };
          }
        }
        
        console.log("⛔ Credenciales inválidas");
        return null;
      },
    }),
  ],
});