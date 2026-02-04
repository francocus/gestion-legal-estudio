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
  DollarSign, 
  LogOut, 
  CalendarDays, 
  TrendingUp 
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [dolar, setDolar] = useState<{ compra: number; venta: number } | null>(null);

  useEffect(() => {
    fetch("https://dolarapi.com/v1/dolares/blue")
      .then((res) => res.json())
      .then((data) => setDolar(data))
      .catch((err) => console.error("Error dólar:", err));
  }, []);

  if (pathname === "/login") return null;

  const VALOR_JUS = 118048.44; 

  return (
     <nav className="w-full border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-50">
        <div className="w-full px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
            
            {/* LADO IZQUIERDO: LOGO + WIDGETS PC */}
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

                {/* WIDGETS (PC) - SEPARADOR VERTICAL */}
                <div className="hidden md:flex items-center gap-4 border-l pl-6 border-gray-200 dark:border-slate-800 h-8">
                    
                    {/* JUS */}
                    <div className="flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            Unidad JUS
                        </span>
                        <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200 leading-none">
                            $ {VALOR_JUS.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                        </span>
                    </div>

                    {/* DÓLAR */}
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

            {/* LADO DERECHO: BUSCADOR + FECHA + TOGGLE + LOGOUT */}
            <div className="flex items-center gap-4">
                
                {/* WIDGETS (MOVIL) */}
                <div className="flex md:hidden items-center gap-2 mr-auto sm:mr-0">
                      <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded bg-gray-50 dark:bg-slate-900">
                        JUS ${Math.round(VALOR_JUS/1000)}k
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30">
                        US$ {dolar ? Math.floor(dolar.venta) : "-"}
                      </span>
                </div>

                {/* 2. BUSCADOR GLOBAL */}
                <div className="hidden md:block">
                    <GlobalSearch />
                </div>

                {/* 3. SEPARADOR (A la derecha del buscador) */}
                <div className="hidden md:block h-8 w-px bg-gray-200 dark:bg-slate-800 mx-1"></div>

                {/* FECHA (PC) */}
                <div className="text-right hidden lg:block border-r pr-4 border-gray-200 dark:border-slate-800 h-8">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                        <CalendarDays className="h-3 w-3" /> Hoy es
                    </p>
                    <p className="text-sm font-medium capitalize text-gray-700 dark:text-gray-200 leading-none mt-0.5">
                        {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <ModeToggle />
                    
                    {/* BOTÓN CERRAR SESIÓN */}
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