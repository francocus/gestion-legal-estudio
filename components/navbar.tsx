"use client";

import { usePathname } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button"; 
import { logout } from "@/app/actions";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GlobalSearch } from "@/components/global-search";

// 👇 IMPORTACIÓN DE ICONOS
import { 
  Scale, 
  LogOut, 
  CalendarDays, 
  TrendingUp,
  Users
} from "lucide-react";

// Definimos la interfaz para las propiedades de la Navbar
interface NavbarProps {
  user: any; // El usuario que viene desde el MainLayout
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [dolar, setDolar] = useState<{ compra: number; venta: number } | null>(null);

  useEffect(() => {
    fetch("https://dolarapi.com/v1/dolares/blue")
      .then((res) => res.json())
      .then((data) => setDolar(data))
      .catch((err) => console.error("Error dólar:", err));
  }, []);

  // Ocultamos la Navbar en las rutas de acceso
  if (pathname === "/login") return null;
  if (pathname === "/register") return null;

  const VALOR_JUS = 118048.44; 

  return (
     <nav className="w-full border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-50">
        <div className="w-full px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
            
            {/* =======================================================
                LADO IZQUIERDO: LOGO + INDICADORES FINANCIEROS
               ======================================================= */}
            <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
                
                {/* LOGO */}
                <Link href="/" className="hover:opacity-80 transition-opacity flex items-center gap-2 group">
                    <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-sm group-hover:bg-blue-700 transition-colors">
                        <Scale className="h-5 w-5" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Estudio Jurídico
                    </h1>
                </Link>

                {/* INDICADORES (SOLO PC) */}
                <div className="hidden md:flex items-center gap-4 border-l pl-6 border-gray-200 dark:border-slate-800 h-8">
                    <div className="flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            Unidad JUS
                        </span>
                        <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200 leading-none">
                            $ {VALOR_JUS.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                        </span>
                    </div>

                    <div className="flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Blue Venta
                          </span>
                          <span className="text-sm font-mono font-bold text-emerald-700 dark:text-emerald-300 leading-none">
                            {dolar ? `$ ${Math.floor(dolar.venta).toLocaleString("es-AR")}` : "..."}
                          </span>
                    </div>
                </div>
            </div>

            {/* =======================================================
                LADO DERECHO: HERRAMIENTAS + USUARIO
               ======================================================= */}
            <div className="flex items-center gap-3">
                
                {/* INDICADORES (MOVIL) */}
                <div className="flex md:hidden items-center gap-2 mr-auto sm:mr-0">
                      <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded bg-gray-50 dark:bg-slate-900">
                        JUS ${Math.round(VALOR_JUS/1000)}k
                      </span>
                </div>

                {/* 1. BUSCADOR GLOBAL */}
                <div className="hidden md:block">
                    <GlobalSearch />
                </div>

                {/* 2. BOTÓN EQUIPO (FILTRADO POR ROL ADMIN) */}
                {user?.role === "ADMIN" && (
                    <Link href="/team">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-2 ${pathname === "/team" ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400" : ""}`}
                        >
                            <Users className="h-4 w-4" />
                            <span className="hidden lg:inline">Equipo</span>
                        </Button>
                    </Link>
                )}

                {/* SEPARADOR PEQUEÑO */}
                <div className="hidden md:block h-6 w-px bg-gray-200 dark:bg-slate-800 mx-1"></div>

                {/* 3. FECHA (SOLO PC) */}
                <div className="text-right hidden xl:block pr-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                        <CalendarDays className="h-3 w-3" /> Hoy es
                    </p>
                    <p className="text-sm font-medium capitalize text-gray-700 dark:text-gray-200 leading-none mt-0.5">
                        {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>

                {/* 4. CONTROLES FINALES */}
                <div className="flex items-center gap-1 pl-2 border-l border-gray-200 dark:border-slate-800">
                    <ModeToggle />
                    
                    <form action={logout}>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full w-9 h-9"
                            title="Cerrar Sesión"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
     </nav>
  );
}