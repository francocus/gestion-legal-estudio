"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { logout, switchUser } from "@/lib/actions/auth";
import { GlobalSearch } from "@/components/global-search";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, RefreshCcw } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface TopbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  } | null;
}

export function Topbar({ user }: TopbarProps) {
  const roleLabel =
    user?.role === "ADMIN" ? "Administrador" : user?.role === "USER" ? "Usuario" : "Usuario";

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80 md:px-6">
      <SidebarTrigger />

      <div className="flex-1 flex justify-center px-2">
        <div className="w-full max-w-md">
          <GlobalSearch />
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <ModeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 px-3 gap-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
              </div>
              <span className="hidden lg:flex flex-col items-start leading-none">
                <span className="text-xs font-semibold max-w-[140px] truncate">
                  {user?.name || user?.email || "Usuario"}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{roleLabel}</span>
              </span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="space-y-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {user?.name || "Usuario"}
              </p>
              <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
                {user?.email || "Sin correo"}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {roleLabel}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={switchUser} className="w-full">
                <button type="submit" className="flex w-full items-center gap-2">
                  <RefreshCcw className="h-4 w-4 text-blue-500" />
                  Cambiar usuario
                </button>
              </form>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <form action={logout} className="w-full">
                <button type="submit" className="flex w-full items-center gap-2 text-red-600 dark:text-red-400">
                  <LogOut className="h-4 w-4" />
                  Cerrar sesion
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
