import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Building2, 
  Landmark, 
  Briefcase,
  FileSpreadsheet
} from "lucide-react";
import { CashFlowChart } from "./cash-flow-chart";
import { CreateEntryDialog } from "@/components/create-entry-dialog";

export const dynamic = "force-dynamic";

export default async function ContabilidadPage() {
  const entries = await db.accountEntry.findMany({
    orderBy: { date: 'desc' },
    include: { case: true }
  });

  const totalIngresos = entries.reduce((acc, curr) => acc + (curr.haber || 0), 0);
  const totalGastos = entries.reduce((acc, curr) => acc + (curr.debe || 0), 0);
  const balanceTotal = totalIngresos - totalGastos;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const entriesThisMonth = entries.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const ingresosMes = entriesThisMonth.reduce((acc, curr) => acc + (curr.haber || 0), 0);
  const gastosMes = entriesThisMonth.reduce((acc, curr) => acc + (curr.debe || 0), 0);
  const balanceMes = ingresosMes - gastosMes;

  const monthlyDataMap = new Map();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthName = d.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase();
    monthlyDataMap.set(monthName, { name: monthName, Ingresos: 0, Egresos: 0 });
  }

  entries.forEach(entry => {
    const d = new Date(entry.date);
    const monthName = d.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase();
    if (monthlyDataMap.has(monthName)) {
      const current = monthlyDataMap.get(monthName);
      current.Ingresos += (entry.haber || 0);
      current.Egresos += (entry.debe || 0);
    }
  });

  const chartData = Array.from(monthlyDataMap.values());

  return (
    <div className="flex-1 w-full p-4 md:p-8 space-y-6">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Tablero de Control</h2>
          <p className="text-sm text-slate-500">Gestión financiera, honorarios, préstamos y administraciones.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" className="hidden sm:flex gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Exportar a Excel
          </Button>
          <CreateEntryDialog />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Saldo General</CardTitle>
            <Wallet className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">$ {balanceTotal.toLocaleString("es-AR")}</div>
            <p className="text-xs text-slate-500 mt-1">Caja fuerte + Bancos</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Ingresos del Mes</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">$ {ingresosMes.toLocaleString("es-AR")}</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Gastos del Mes</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">$ {gastosMes.toLocaleString("es-AR")}</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Flujo Neto (Mes)</CardTitle>
            <Landmark className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balanceMes >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              $ {balanceMes.toLocaleString("es-AR")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-slate-900/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Cash Flow (Últimos 6 meses)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <CashFlowChart data={chartData} />
        </CardContent>
      </Card>

      <Card className="dark:bg-slate-900/50 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800 pb-4">
          <CardTitle className="text-lg">Planilla Bancaria / Libro Mayor</CardTitle>
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 mt-4 sm:mt-0">
             <Button variant="outline" size="sm" className="gap-2 text-xs"><Briefcase className="h-3 w-3"/> Honorarios</Button>
             <Button variant="outline" size="sm" className="gap-2 text-xs"><Building2 className="h-3 w-3"/> Alquileres / Obras</Button>
             <Button variant="outline" size="sm" className="gap-2 text-xs"><Landmark className="h-3 w-3"/> Préstamos</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Fecha</th>
                  <th className="px-6 py-4 font-semibold">Concepto</th>
                  <th className="px-6 py-4 font-semibold">Descripción</th>
                  <th className="px-6 py-4 font-semibold text-right text-red-500">Debe (Salida)</th>
                  <th className="px-6 py-4 font-semibold text-right text-emerald-500">Haber (Entrada)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">No hay movimientos registrados en la contabilidad.</td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {new Date(entry.date).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                          {entry.concept}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900 dark:text-slate-200">{entry.description}</p>
                        {entry.case && (
                          <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[200px]">Ref: {entry.case.caratula}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-red-600 dark:text-red-400">
                        {entry.debe > 0 ? `$ ${entry.debe.toLocaleString("es-AR")}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {entry.haber > 0 ? `$ ${entry.haber.toLocaleString("es-AR")}` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}