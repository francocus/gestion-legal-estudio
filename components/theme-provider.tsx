"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// Si usas una versión vieja de next-themes, podría requerir props diferentes, 
// pero esto es estándar para la v5/v6.

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}