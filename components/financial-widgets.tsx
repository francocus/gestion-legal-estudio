import { Card, CardContent } from "@/components/ui/card";
import { Scale, DollarSign, TrendingUp, RefreshCcw } from "lucide-react";

async function getDolarBlue() {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/blue', { 
      next: { revalidate: 3600 } 
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Error al obtener dolar", error);
    return null;
  }
}

export async function FinancialWidgets() {
  const dolar = await getDolarBlue();
  const VALOR_JUS = 118048.44; 

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
      
      {/* TARJETA JUS: Adaptable Claro/Oscuro */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-sm overflow-hidden relative group">
         {/* Icono de fondo decorativo */}
         <div className="absolute -right-6 -top-6 p-4 opacity-100 transition-opacity">
            <Scale className="h-40 w-40 text-slate-100 dark:text-slate-800 group-hover:text-slate-200 dark:group-hover:text-slate-700 transition-colors" />
         </div>

         <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
            <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Scale className="h-3 w-3" /> Colegio de Abogados (Santa Fe)
                </p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Unidad JUS</h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs flex items-center gap-1">
                    <RefreshCcw className="h-3 w-3" /> Actualizado al 01/11/2025
                </p>
            </div>
            <div className="mt-4">
                <span className="text-4xl font-mono font-bold text-slate-900 dark:text-white mb-1">
                    $ {VALOR_JUS.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
            </div>
         </CardContent>
      </Card>

      {/* TARJETA DÓLAR: Mantiene su color sólido verde (es distintivo) */}
      <Card className="bg-emerald-600 dark:bg-emerald-900 border-emerald-500 dark:border-emerald-800 text-white shadow-sm relative overflow-hidden group">
         <div className="absolute -right-6 -top-6 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="h-40 w-40 text-emerald-200 dark:text-emerald-800" />
         </div>
         
         <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1 opacity-80 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Cotización en Vivo
                    </p>
                    <h3 className="text-2xl font-bold text-white">Dólar Blue</h3>
                </div>
                <div className="text-right">
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-800/30 px-2 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/20">
                        Variación Diaria
                    </span>
                </div>
            </div>
            
            <div className="mt-4 flex items-end gap-6">
                <div>
                    <p className="text-xs text-emerald-100 font-bold uppercase mb-1 opacity-80">Compra</p>
                    <p className="text-3xl font-mono font-bold text-white">
                        $ {dolar ? Math.floor(dolar.compra) : "---"}
                    </p>
                </div>
                <div className="h-8 w-px bg-emerald-400/50"></div>
                <div>
                    <p className="text-xs text-emerald-100 font-bold uppercase mb-1 opacity-80">Venta</p>
                    <p className="text-3xl font-mono font-bold text-white">
                        $ {dolar ? Math.floor(dolar.venta) : "---"}
                    </p>
                </div>
            </div>
            
            <p className="text-[10px] text-emerald-100/60 mt-2 text-right">
                Fuente: DolarApi.com
            </p>
         </CardContent>
      </Card>

    </div>
  );
}