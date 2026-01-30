import { ModeToggle } from "@/components/mode-toggle";
import { logout } from "@/app/actions";
import { db } from "@/lib/db";
import { CreateClientDialog } from "@/components/client-form";
import { SearchInput } from "@/components/search-input";
import { DeleteButton } from "@/components/delete-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { FinancialWidgets } from "@/components/financial-widgets";
import { AreaFilter } from "@/components/area-filter";

// 👇 IMPORTACIÓN UNIFICADA DE ICONOS
import { 
  Gavel, 
  Users, 
  Briefcase, 
  ShieldAlert, 
  HeartHandshake, 
  FileText, 
  LayoutGrid,
  AlertCircle,
  CalendarDays,
  Clock,
  CheckCircle2
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

  // 1. Consulta de Clientes con Filtros
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

  // --- CÁLCULOS FINANCIEROS ---
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
    <div className="flex-1 w-full p-6 space-y-8">

      {/* SECCIÓN 0: WIDGETS FINANCIEROS */}
      <FinancialWidgets />

      {/* SECCIÓN 1: AGENDA DE VENCIMIENTOS PROFESIONALIZADA */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white text-slate-800">
            📅 Agenda de Vencimientos
            {upcomingEvents.length > 0 && (
                <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full animate-pulse">
                    {upcomingEvents.length} Pendientes
                </span>
            )}
        </h2>

        {upcomingEvents.length === 0 ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-xl p-8 text-center text-green-800 dark:text-green-300">
                 🎉 ¡Todo al día! No hay vencimientos pendientes.
            </div>
        ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        bgClass = "bg-red-50 dark:bg-slate-900"; 
                        statusText = daysLeft === 0 ? "¡VENCE HOY!" : "¡VENCE MAÑANA!";
                        textColor = "text-red-700 dark:text-red-400 font-bold animate-pulse";
                    } else if (daysLeft <= 7) {
                        borderClass = "border-l-yellow-400";
                        bgClass = "bg-yellow-50 dark:bg-yellow-900/20"; 
                        statusText = `Atención: ${daysLeft} días`;
                        textColor = "text-yellow-800 dark:text-yellow-400";
                    }

                    return (
                        <Link key={evt.id} href={`/client/${evt.case.clientId}/case/${evt.case.id}`}>
                            <Card className={`border-l-[6px] shadow-sm hover:shadow-md transition-all cursor-pointer h-full border-y border-r border-gray-200 dark:border-y-slate-800 dark:border-r-slate-800 ${borderClass} ${bgClass} group`}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-bold ${textColor}`}>
                                            {daysLeft < 0 ? <CheckCircle2 className="h-3.5 w-3.5" /> : 
                                             daysLeft <= 1 ? <AlertCircle className="h-3.5 w-3.5" /> : 
                                             <Clock className="h-3.5 w-3.5" />}
                                            {statusText}
                                        </span>
                                        <span className="text-[10px] bg-white/60 dark:bg-black/40 px-2 py-1 rounded border dark:border-slate-700 shadow-sm font-mono dark:text-gray-300">
                                            {evt.date.toLocaleDateString()}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-lg leading-tight mb-1 text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                                        {evt.title}
                                    </h3>

                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200/50 dark:border-slate-700/50 space-y-1">
                                        <p className="flex items-center gap-1.5 font-medium truncate">
                                            {evt.type === 'HEARING' ? <Gavel className="h-3.5 w-3.5 text-blue-500" /> :
                                             evt.type === 'MEETING' ? <Users className="h-3.5 w-3.5 text-amber-500" /> :
                                             <CalendarDays className="h-3.5 w-3.5 text-slate-500" />}
                                            Exp: {evt.case.caratula}
                                        </p>
                                        <p className="text-[11px] truncate text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                                            <Users className="h-3 w-3" /> Cliente: {evt.case.client.lastName}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        )}
      </div>

      {/* SECCIÓN 2: RESUMEN DE CAJA */}
      <div className="grid md:grid-cols-4 gap-6">
          <Card className={`md:col-span-2 shadow-sm border-l-4 dark:bg-slate-900 dark:border-y-slate-800 dark:border-r-slate-800 ${balance >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
             <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">Balance del Estudio</CardTitle>
             </CardHeader>
             <CardContent>
                <div className={`text-4xl font-bold ${balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                    $ {balance.toLocaleString()}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Total Ingresos - Total Gastos</p>
             </CardContent>
          </Card>
          
          <Card className="dark:bg-slate-900 dark:border-slate-800">
             <CardContent className="pt-6">
                <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase mb-1">Ingresos Totales</p>
                <div className="text-2xl font-bold text-gray-700 dark:text-gray-200">+ $ {totalIngresos.toLocaleString()}</div>
             </CardContent>
          </Card>
          
          <Card className="dark:bg-slate-900 dark:border-slate-800">
             <CardContent className="pt-6">
                <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase mb-1">Gastos Totales</p>
                <div className="text-2xl font-bold text-gray-700 dark:text-gray-200">- $ {totalGastos.toLocaleString()}</div>
             </CardContent>
          </Card>
      </div>

      {/* SECCIÓN 3: CLIENTES Y BÚSQUEDA */}
      <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                📇 Mis Clientes
            </h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <SearchInput /> 
                <CreateClientDialog />
            </div>
          </div>
          
          <div className="pt-2 border-t border-gray-200 dark:border-slate-800">
             <AreaFilter />
          </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
          {/* LISTADO DE CLIENTES CON ICONOS UNIFICADOS */}
          <div className="lg:col-span-2 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {clients.map((client) => (
                  <Card key={client.id} className="hover:shadow-lg transition-shadow border-t-4 border-t-slate-800 dark:border-t-slate-600 dark:bg-slate-900 dark:border-slate-800 relative group h-full">
                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DeleteButton id={client.id} type="CLIENT" />
                    </div>
                    <Link href={`/client/${client.id}`} className="block h-full">
                      <CardContent className="p-5 flex flex-col justify-between h-full">
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                                {client.lastName}, {client.firstName}
                            </h3>
                            {client.phone && (
                                <p className="text-xs text-gray-400 mt-1">📞 {client.phone}</p>
                            )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-1">
                            {client.cases.length > 0 ? (
                                client.cases.map((c, i) => {
                                    const iconMap = {
                                        FAMILIA: { icon: Users, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-900/20", border: "border-pink-100 dark:border-pink-900" },
                                        PENAL: { icon: ShieldAlert, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-100 dark:border-red-900" },
                                        LABORAL: { icon: Briefcase, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-100 dark:border-emerald-900" },
                                        CIVIL: { icon: Gavel, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-100 dark:border-blue-900" },
                                        PREVISIONAL: { icon: HeartHandshake, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-100 dark:border-amber-900" },
                                        ADMINISTRATIVO: { icon: FileText, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/20", border: "border-slate-100 dark:border-slate-800" },
                                    };

                                    const areaInfo = iconMap[c.area as keyof typeof iconMap] || iconMap.CIVIL;
                                    const Icon = areaInfo.icon;

                                    return (
                                        <span key={i} className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border uppercase transition-colors ${areaInfo.bg} ${areaInfo.border} ${areaInfo.color}`}>
                                            <Icon className="h-3 w-3" />
                                            {c.area || 'CIVIL'}
                                        </span>
                                    );
                                })
                            ) : (
                                <span className="text-[10px] text-gray-400 italic flex items-center gap-1">
                                    <LayoutGrid className="h-3 w-3" /> Sin casos activos
                                </span>
                            )}
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
                {clients.length === 0 && (
                    <div className="col-span-full py-10 text-center text-gray-400 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
                        {query || area 
                            ? "No se encontraron clientes con esos filtros. 🕵️‍♂️" 
                            : "No hay clientes cargados."}
                    </div>
                )}
              </div>
          </div>

          {/* ÚLTIMOS PAGOS */}
          <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                  <h2 className="text-xl font-bold dark:text-white">💸 Últimos Pagos</h2>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm divide-y divide-gray-100 dark:divide-slate-800 overflow-hidden">
                  {recentTransactions.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 text-sm">Sin movimientos recientes.</div>
                  ) : (
                      recentTransactions.map(t => (
                          <Link key={t.id} href={`/client/${t.case.clientId}/case/${t.case.id}`} className="block hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                            <div className="p-3 flex justify-between items-center text-sm">
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{t.description}</p>
                                    <p className="text-[10px] text-gray-400 truncate max-w-[120px]">
                                        Exp: {t.case.caratula}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`block font-bold ${t.type === 'INCOME' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {t.type === 'INCOME' ? '+' : '-'} ${t.amount.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-gray-400">{t.date.toLocaleDateString()}</span>
                                </div>
                            </div>
                          </Link>
                      ))
                  )}
              </div>
          </div>
      </div>
    </div>
  );
}