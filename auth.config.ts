import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      // 🕵️‍♂️ VAMOS A ESPIAR AL PORTERO
      const isLoggedIn = !!auth?.user;
      console.log(`👮‍♂️ Middleware revisando: ${nextUrl.pathname}`);
      console.log(`   ¿Está logueado?: ${isLoggedIn ? "SÍ ✅" : "NO ❌"}`);

      const isOnDashboard = nextUrl.pathname.startsWith("/");
      const isOnLogin = nextUrl.pathname.startsWith("/login");

      // Lógica de Redirección
      if (isOnDashboard) {
        if (isOnLogin) {
            return isLoggedIn ? Response.redirect(new URL("/", nextUrl)) : true;
        }
        // Si quiere entrar al sistema, TIENE que estar logueado
        return isLoggedIn; 
      }
      return true;
    },
  },
  providers: [], 
} satisfies NextAuthConfig;