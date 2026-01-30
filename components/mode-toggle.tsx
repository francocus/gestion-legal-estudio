"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react"; // Importamos los iconos profesionales
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full w-9 h-9 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      title="Cambiar modo de color"
    >
      {/* Icono de Sol: Se muestra en modo claro y se oculta con rotación en oscuro */}
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
      
      {/* Icono de Luna: Se muestra en modo oscuro y se oculta con rotación en claro */}
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
      
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
}