"use client";

import { usePathname } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { logout } from "@/app/actions";
import Link from "next/link";
import { useEffect, useState } from "react";

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
        {/* 👇 CAMBIO CLAVE: "w-full px-6" en lugar de "max-w-7xl mx-auto" */}
        <div className="w-full px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
            
            {/* LADO IZQUIERDO */}
            <div className="flex items-center gap-6">
                <div>
                    <Link href="/" className="hover:opacity-80 transition-opacity">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            ⚖️ <span className="hidden sm:inline">Estudio Jurídico</span>
                        </h1>
                    </Link>
                    <div className="flex items-center gap-3 mt-1">
                        <form action={logout}>
                            <button className="text-[10px] text-red-500 hover:text-red-600 font-bold uppercase tracking-wider">
                                ( Cerrar Sesión )
                            </button>
                        </form>
                    </div>
                </div>

                {/* WIDGETS (PC) */}
                <div className="hidden md:flex items-center gap-3 border-l pl-6 border-gray-200 dark:border-slate-800">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unidad JUS</span>
                        <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200">
                            $ {VALOR_JUS.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                        </span>
                    </div>
                    <div className="h-6 w-px bg-gray-200 dark:bg-slate-800 mx-2"></div>
                    <div className="flex flex-col">
                         <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                            💵 Blue Venta
                         </span>
                         <span className="text-sm font-mono font-bold text-emerald-700 dark:text-emerald-300">
                            {dolar ? `$ ${Math.floor(dolar.venta).toLocaleString("es-AR")}` : "Cargando..."}
                         </span>
                    </div>
                </div>
            </div>

            {/* LADO DERECHO */}
            <div className="flex items-center gap-6">
                {/* WIDGETS (MOVIL) */}
                <div className="flex md:hidden items-center gap-2 mr-2">
                     <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 border px-1 rounded bg-gray-100 dark:bg-slate-900">
                        JUS ${Math.round(VALOR_JUS/1000)}k
                     </span>
                     <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 border px-1 rounded bg-emerald-50 dark:bg-emerald-950/30">
                        US$ {dolar ? Math.floor(dolar.venta) : "-"}
                     </span>
                </div>

                <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Hoy es</p>
                    <p className="text-sm font-medium capitalize text-gray-700 dark:text-gray-200">
                        {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
                <ModeToggle />
            </div>
        </div>
     </nav>
  );
}