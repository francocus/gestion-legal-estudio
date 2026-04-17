"use client";

import { usePathname } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { logout, switchUser } from "@/lib/actions/auth";
import Link from "next/link";
import { GlobalSearch } from "@/components/global-search";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Scale,
  LogOut,
  CalendarDays,
  Users,
  BookOpen,
  Calendar,
  Wallet,
  Home,
  UserCircle2,
  RefreshCcw,
  ReceiptText,
} from "lucide-react";

interface NavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  if (pathname === "/login") return null;
  if (pathname === "/register") return null;

  const today = new Date();
  const day = today.getDate();
  const monthRaw = today.toLocaleString("es-AR", { month: "short" }).replace(".", "");
  const month = monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1);
  const year = today.getFullYear();
  const displayDate = `${day} ${month} ${year}`;
  const roleLabel =
    user?.role === "ADMIN" ? "Administrador" :
    user?.role === "USER" ? "Usuario" :
    user?.role || "Usuario";

  return (
    <nav className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="w-full px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center shrink-0">
          <Link href="/" className="hover:opacity-80 transition-opacity flex items-center gap-2 group">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-sm group-hover:bg-blue-700 transition-colors">
              <Scale className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Estudio Juridico</h1>
          </Link>
        </div>

        <div className="hidden md:block flex-1 px-6">
          <div className="w-full">
            <GlobalSearch />
          </div>
        </div>

        <div className="flex items-center shrink-0">
          <div className="flex items-center gap-1">
            <Link href="/">
              <Button variant="ghost" size="sm" className={`text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-2 ${pathname === "/" ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold" : ""}`}>
                <Home className="h-4 w-4" />
                <span className="hidden lg:inline">Inicio</span>
              </Button>
            </Link>

            <div className="hidden md:block h-6 w-px bg-slate-300 dark:bg-slate-700 mx-3" />

            <Link href="/agenda">
              <Button variant="ghost" size="sm" className={`text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-2 ${pathname === "/agenda" ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold" : ""}`}>
                <Calendar className="h-4 w-4" />
                <span className="hidden lg:inline">Agenda</span>
              </Button>
            </Link>

            <Link href="/biblioteca">
              <Button variant="ghost" size="sm" className={`text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-2 ${pathname === "/biblioteca" ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold" : ""}`}>
                <BookOpen className="h-4 w-4" />
                <span className="hidden lg:inline">Biblioteca</span>
              </Button>
            </Link>

            <Link href="/clientes">
              <Button variant="ghost" size="sm" className={`text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-2 ${pathname === "/clientes" ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold" : ""}`}>
                <Users className="h-4 w-4" />
                <span className="hidden lg:inline">Clientes</span>
              </Button>
            </Link>

            <Link href="/contabilidad">
              <Button variant="ghost" size="sm" className={`text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-2 ${pathname === "/contabilidad" ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold" : ""}`}>
                <Wallet className="h-4 w-4" />
                <span className="hidden lg:inline">Contabilidad</span>
              </Button>
            </Link>

            <Link href="/obligaciones">
              <Button variant="ghost" size="sm" className={`text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-2 ${pathname === "/obligaciones" ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold" : ""}`}>
                <ReceiptText className="h-4 w-4" />
                <span className="hidden lg:inline">Obligaciones</span>
              </Button>
            </Link>

            {user?.role === "ADMIN" && (
              <Link href="/team">
                <Button variant="ghost" size="sm" className={`text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-2 ${pathname === "/team" ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold" : ""}`}>
                  <Users className="h-4 w-4" />
                  <span className="hidden lg:inline">Equipo</span>
                </Button>
              </Link>
            )}
          </div>

          <div className="hidden md:block h-6 w-px bg-slate-300 dark:bg-slate-700 mx-3" />

          <div className="text-right hidden xl:block pr-1">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center justify-end gap-1">
              <CalendarDays className="h-3 w-3" /> Hoy
            </p>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-none mt-1">{displayDate}</p>
          </div>

          <div className="hidden md:block h-6 w-px bg-slate-300 dark:bg-slate-700 mx-3" />

          <div className="flex items-center gap-1">
            <ModeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 px-3 gap-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <UserCircle2 className="h-4 w-4 text-blue-500" />
                  <span className="hidden lg:flex flex-col items-start leading-none">
                    <span className="text-xs font-semibold max-w-[140px] truncate">
                      {user?.name || user?.email || "Usuario"}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {roleLabel}
                    </span>
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
        </div>
      </div>
    </nav>
  );
}
