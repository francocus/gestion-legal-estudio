import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      
      // 👇 Borramos los console.log de acá

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