import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Protegemos todo menos los archivos estáticos y las imágenes
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};