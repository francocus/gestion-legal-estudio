import { db } from "@/lib/db";
import { CreateClientDialog } from "@/components/client-form";
import { SearchInput } from "@/components/search-input";
import { DeleteButton } from "@/components/delete-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { FinancialWidgets } from "@/components/financial-widgets";
import { AreaFilter } from "@/components/area-filter";
import { Button } from "@/components/ui/button";

// 👇 IMPORTACIÓN DE ICONOS
import { 
  Users, 
  Briefcase, 
  ShieldAlert, 
  HeartHandshake, 
  FileText, 
  LayoutGrid,
  AlertCircle,
  CalendarDays,
  Clock,
  CheckCircle2,
  Phone,
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scale,
  Wallet,
  ArrowRight,
  BarChart3,
  Gavel
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    area?: string;
  }>;
}

export default async function Home({ searchParams }: PageProps) {
  
  const params = await searchParams;
  const query = params.q || ""; 
  const area = params.area || undefined;

  // 1. Consulta de Clientes
  const clients = await db.client.findMany({
    where: {
        AND: [
            {
                OR: [
                    { lastName: { contains: query, mode: 'insensitive' } },
                    { firstName: { contains: query, mode: 'insensitive' } },
                ]
            },
            area ? {
                cases: {
                    some: { area: area }
                }
            } : {}
        ]
    },
    orderBy: { createdAt: "desc" },
    include: { 
        cases: {
            where: { status: 'ACTIVE' },
            select: { area: true, status: true }
        } 
    }
  });

  // 2. Consulta de Agenda
  const upcomingEvents = await db.event.findMany({
    where: { isDone: false },
    orderBy: { date: "asc" }, 
    take: 6, 
    include: {
        case: { include: { client: true } }
    }
  });

  // 3. Consulta de Finanzas
  const allTransactions = await db.transaction.findMany({
    orderBy: { date: 'desc' },
    include: { case: true } 
  });

  // --- CÁLCULOS FINANCIEROS BÁSICOS ---
  const totalIngresos = allTransactions
    .filter(t => t.type === "INCOME")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalGastos = allTransactions
    .filter(t => t.type === "EXPENSE")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIngresos - totalGastos;
  const recentTransactions = allTransactions.slice(0, 5);

  const getDaysDiff = (date: Date) => {
    const today = new Date();
    today.setHours(0,0,0,0); 
    const eventDate = new Date(date);
    eventDate.setHours(0,0,0,0);
    const diffTime = eventDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="flex-1 w-full p-6 space-y-6">

      {/* SECCIÓN 0: WIDGETS (Siempre útiles arriba) */}
      <FinancialWidgets />

      {/* GRID PRINCIPAL: 2 Columnas (Izquierda Operativa / Derecha Financiera) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* === COLUMNA IZQUIERDA (Prioridad Operativa) === */}
        <div className="lg:col-span-8 space-y-8">
            
            {/* 1. AGENDA DE VENCIMIENTOS */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white text-slate-800">
                        <CalendarDays className="h-6 w-6 text-blue-600" /> Agenda Prioritaria
                        {upcomingEvents.length > 0 && (
                            <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full animate-pulse">
                                {upcomingEvents.length}
                            </span>
                        )}
                    </h2>
                </div>

                {upcomingEvents.length === 0 ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-xl p-6 text-center text-green-800 dark:text-green-300 flex flex-col items-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                        <span>¡Todo al día! No hay vencimientos pendientes.</span>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-3">
                        {upcomingEvents.map(evt => {
                            const daysLeft = getDaysDiff(evt.date);
                            let borderClass = "border-l-green-500"; 
                            let bgClass = "bg-white dark:bg-slate-900";
                            let statusText = `Faltan ${daysLeft} días`;
                            let textColor = "text-green-700 dark:text-green-400";
                            
                            if (daysLeft < 0) {
                                borderClass = "border-l-gray-400";
                                bgClass = "bg-gray-50 dark:bg-slate-800 opacity-70";
                                statusText = `Venció hace ${Math.abs(daysLeft)} días`;
                                textColor = "text-gray-600 dark:text-gray-400";
                            } else if (daysLeft <= 1) {
                                borderClass = "border-l-red-500";
                                bgClass = "bg-red-50 dark:bg-red-950/20"; 
                                statusText = daysLeft === 0 ? "¡VENCE HOY!" : "¡VENCE MAÑANA!";
                                textColor = "text-red-700 dark:text-red-400 font-bold";
                            } else if (daysLeft <= 7) {
                                borderClass = "border-l-yellow-400";
                                bgClass = "bg-yellow-50 dark:bg-yellow-900/20"; 
                                statusText = `Atención: ${daysLeft} días`;
                                textColor = "text-yellow-800 dark:text-yellow-400";
                            }

                            return (
                                <Link key={evt.id} href={`/client/${evt.case.clientId}/case/${evt.case.id}`}>
                                    <Card className={`border-l-[4px] shadow-sm hover:shadow-md transition-all cursor-pointer h-full border-y border-r border-gray-200 dark:border-y-slate-800 dark:border-r-slate-800 ${borderClass} ${bgClass} group`}>
                                        <CardContent className="p-3">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-[10px] uppercase tracking-wider font-bold ${textColor}`}>
                                                    {statusText}
                                                </span>
                                                <span className="text-[10px] font-mono text-slate-400">
                                                    {evt.date.toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-base text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                                                {evt.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                <Briefcase className="h-3 w-3" /> {evt.case.caratula}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 2. CLIENTES (Buscador y Lista) */}
            <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Users className="h-6 w-6 text-slate-600 dark:text-slate-400" /> Clientes
                    </h2>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <SearchInput /> 
                        <CreateClientDialog />
                    </div>
                </div>
                <AreaFilter />

                <div className="grid md:grid-cols-2 gap-4">
                    {clients.map((client) => (
                        <Card key={client.id} className="hover:border-blue-300 dark:hover:border-blue-700 transition-colors border shadow-sm dark:bg-slate-900 dark:border-slate-800 group">
                            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DeleteButton id={client.id} type="CLIENT" />
                            </div>
                            <Link href={`/client/${client.id}`} className="block p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                            {client.lastName}, {client.firstName}
                                        </h3>
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                            <Phone className="h-3 w-3" /> {client.phone || "Sin contacto"}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {/* 👇 ACÁ ESTÁ EL CAMBIO PARA LOS COLORES */}
                                        {client.cases.map((c, i) => {
                                            
                                            const areaStyles: Record<string, string> = {
                                                CIVIL: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
                                                FAMILIA: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800",
                                                LABORAL: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
                                                PENAL: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
                                                PREVISIONAL: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
                                                ADMINISTRATIVO: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800",
                                            };

                                            const style = areaStyles[c.area || 'CIVIL'] || areaStyles.CIVIL;

                                            return (
                                                <span key={i} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${style}`}>
                                                    {c.area || 'CIVIL'}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            </Link>
                        </Card>
                    ))}
                    
                    {clients.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
                            <Search className="h-10 w-10 mx-auto mb-2 opacity-20" />
                            <p>No se encontraron clientes.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* === COLUMNA DERECHA (Resumen Financiero y Actividad) === */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* TARJETA DE ESTADO FINANCIERO (Compacta y Linkeada) */}
            <Card className="bg-slate-900 text-white border-slate-800 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <BarChart3 className="h-32 w-32" />
                </div>
                <CardHeader className="pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Wallet className="h-4 w-4" /> Caja del Estudio
                    </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="mb-4">
                        <span className="text-4xl font-bold tracking-tight">
                            $ {balance.toLocaleString()}
                        </span>
                        <p className="text-xs text-slate-400 mt-1">Balance Total (Ingresos - Gastos)</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6 border-t border-slate-800 pt-4">
                        <div>
                            <p className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> Ingresos
                            </p>
                            <p className="font-mono text-lg">$ {totalIngresos.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-red-400 uppercase font-bold flex items-center gap-1">
                                <TrendingDown className="h-3 w-3" /> Gastos
                            </p>
                            <p className="font-mono text-lg">$ {totalGastos.toLocaleString()}</p>
                        </div>
                    </div>

                    <Link href="/reports">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md group">
                            Ver Reportes y Gráficos <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            {/* LISTA DE ÚLTIMOS PAGOS (Compacta) */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <Clock className="h-4 w-4 text-slate-500" /> Actividad Reciente
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {recentTransactions.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400 italic">
                            Sin movimientos recientes.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentTransactions.map(t => (
                                <Link key={t.id} href={`/client/${t.case.clientId}/case/${t.case.id}`} className="block hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <div className="p-3 flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            {t.type === 'INCOME' 
                                                ? <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1 rounded-full"><TrendingUp className="h-3 w-3 text-emerald-600" /></div>
                                                : <div className="bg-red-100 dark:bg-red-900/30 p-1 rounded-full"><TrendingDown className="h-3 w-3 text-red-600" /></div>
                                            }
                                            <div className="truncate">
                                                <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{t.description}</p>
                                                <p className="text-[10px] text-slate-400">{t.date.toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={`font-mono font-bold whitespace-nowrap ${t.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {t.type === 'INCOME' ? '+' : '-'} ${t.amount.toLocaleString()}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
      </div>
    </div>
  );
}