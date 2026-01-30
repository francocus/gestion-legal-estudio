import { Card, CardContent } from "@/components/ui/card";

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      
      {/* TARJETA JUS (Azul Oscuro / Negro) */}
      <Card className="bg-slate-900 border-slate-800 text-white shadow-lg overflow-hidden relative group">
         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl">⚖️</span>
         </div>
         <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
            <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                    Colegio de Abogados (Santa Fe)
                </p>
                <h3 className="text-2xl font-bold text-white mb-1">Unidad JUS</h3>
                <p className="text-slate-500 text-xs">Actualizado al 01/11/2025</p>
            </div>
            <div className="mt-4">
                <span className="text-4xl font-mono font-bold text-blue-400">
                    $ {VALOR_JUS.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
            </div>
         </CardContent>
      </Card>

      {/* TARJETA DÓLAR (Fondo Verde Sólido) */}
      <Card className="bg-emerald-600 dark:bg-emerald-900 border-emerald-500 dark:border-emerald-800 text-white shadow-lg relative overflow-hidden group">
         {/* Icono de fondo decorativo */}
         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl">💵</span>
         </div>
         
         <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1 opacity-80">
                        Cotización en Vivo
                    </p>
                    <h3 className="text-2xl font-bold text-white">Dólar Blue</h3>
                </div>
                {/* Badge de Variación */}
                <div className="text-right">
                    <span className="inline-flex items-center rounded-md bg-emerald-800/30 px-2 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/20">
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
                {/* Divisor vertical */}
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