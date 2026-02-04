import { db } from "@/lib/db";
import { ReportsDashboard } from "@/components/reports-dashboard";
import { ChevronLeft, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic"; // Para que los datos estén siempre frescos

export default async function ReportsPage() {
  
  // 1. OBTENER DATOS DE LA BASE
  const transactions = await db.transaction.findMany({
    orderBy: { date: 'asc' }
  });

  const cases = await db.case.findMany();
  const clientsCount = await db.client.count();

  // 2. PROCESAR DATOS PARA EL GRÁFICO DE FINANZAS (Agrupar por mes)
  const monthlyStats = new Map();
  
  // Inicializamos los últimos 6 meses en 0 para que el gráfico no quede vacío
  for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('es-AR', { month: 'short' }); // "ene", "feb"
      monthlyStats.set(key, { name: key, ingresos: 0, gastos: 0 });
  }

  // Sumamos los montos reales
  transactions.forEach(t => {
      const key = t.date.toLocaleString('es-AR', { month: 'short' });
      if (monthlyStats.has(key)) {
          const current = monthlyStats.get(key);
          if (t.type === 'INCOME') current.ingresos += t.amount;
          if (t.type === 'EXPENSE') current.gastos += t.amount;
      }
  });

  const financialData = Array.from(monthlyStats.values());

  // 3. PROCESAR DATOS PARA EL GRÁFICO DE TORTA (Agrupar por Área)
  const areasMap = new Map();
  cases.forEach(c => {
      const area = c.area || "SIN CLASIFICAR";
      areasMap.set(area, (areasMap.get(area) || 0) + 1);
  });

  const areaData = Array.from(areasMap.entries()).map(([name, value]) => ({ name, value }));

  // 4. CALCULAR KPI (Indicadores)
  const currentMonthKey = new Date().toLocaleString('es-AR', { month: 'short' });
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthKey = lastMonthDate.toLocaleString('es-AR', { month: 'short' });

  const currentIncome = monthlyStats.get(currentMonthKey)?.ingresos || 0;
  const lastIncome = monthlyStats.get(lastMonthKey)?.ingresos || 1; // Evitar división por cero
  
  const growth = Math.round(((currentIncome - lastIncome) / lastIncome) * 100);

  const kpiData = {
      totalActive: cases.filter(c => c.status === 'ACTIVE').length,
      totalClients: clientsCount,
      monthlyIncome: currentIncome,
      monthlyGrowth: growth
  };

  return (
    <div className="w-full p-6 space-y-6">
       {/* Header Simple */}
       <div className="flex items-center gap-4 mb-6">
            <Link href="/">
                <Button variant="ghost" size="icon">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
            </Link>
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="h-8 w-8 text-blue-600" /> Reportes del Estudio
                </h1>
                <p className="text-slate-500 dark:text-slate-400">Métricas de rendimiento y finanzas en tiempo real.</p>
            </div>
       </div>

       {/* Renderizamos el Dashboard Cliente con los datos procesados */}
       <ReportsDashboard 
          financialData={financialData} 
          areaData={areaData} 
          kpi={kpiData} 
       />
    </div>
  );
}