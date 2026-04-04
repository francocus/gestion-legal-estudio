import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      const isOnSwitchUser = nextUrl.pathname.startsWith("/switch-user");

      if (isOnLogin || isOnSwitchUser) {
        return isLoggedIn ? Response.redirect(new URL("/", nextUrl)) : true;
      }

      return isLoggedIn;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
