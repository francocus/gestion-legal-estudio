import { db } from "@/lib/db";
import { CreateClientDialog } from "@/components/client-form";
import { SearchInput } from "@/components/search-input";
import { DeleteButton } from "@/components/delete-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AreaFilter } from "@/components/area-filter";
import { Button } from "@/components/ui/button";
import { PageBreadcrumb } from "@/components/page-breadcrumb";

import { 
  Users, CalendarDays, CheckCircle2, Phone,
  TrendingUp, TrendingDown, Wallet, ArrowRight,
  FolderOpen, Scale, Activity, AlertTriangle,
  Zap, Clock, Gavel, BookOpen, ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

function getUtcMonthKey(dateValue: Date) {
  const date = new Date(dateValue);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

interface PageProps {
  searchParams: Promise<{ q?: string; area?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  
  const params = await searchParams;
  const query = params.q || ""; 
  const area  = params.area || undefined;

  // ─── METRICAS ───────────────────────────────────────────────
  const totalClients        = await db.client.count();
  const judicialCases       = await db.case.count({ where: { isExtrajudicial: false, status: { not: 'ARCHIVED' } } });
  const extrajudicialCases  = await db.case.count({ where: { isExtrajudicial: true, status: { not: 'ARCHIVED' } } });
  const pendingEvents       = await db.event.count({ where: { isDone: false } });

  // ─── FILTROS ────────────────────────────────────────────────
  let caseCondition = {};
  if (area === "EXTRAJUDICIAL") {
    caseCondition = { cases: { some: { isExtrajudicial: true } } };
  } else if (area) {
    caseCondition = { cases: { some: { area, isExtrajudicial: false } } };
  }

  // ─── CLIENTES ───────────────────────────────────────────────
  const clients = await db.client.findMany({
    where: {
      AND: [
        { OR: [
          { lastName:  { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
        ]},
        caseCondition
      ]
    },
    orderBy: { createdAt: "desc" },
    include: { cases: { where: { status: 'ACTIVE' }, select: { area: true, status: true, isExtrajudicial: true } } }
  });

  // ─── AGENDA ─────────────────────────────────────────────────
  const upcomingEvents = await db.event.findMany({
    where: { isDone: false },
    orderBy: { date: "asc" },
    take: 8,
    include: { case: { include: { client: true } } }
  });

  // ─── CONTABILIDAD ───────────────────────────────────────────
  const allAccountEntries = await db.accountEntry.findMany({
    orderBy: { date: 'desc' },
    include: { case: { select: { caratula: true, code: true } } }
  });

  const now              = new Date();
  const currentMonthKey  = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const entriesThisMonth = allAccountEntries.filter(e => getUtcMonthKey(e.date) === currentMonthKey);

  const totalIngresos   = allAccountEntries.reduce((acc, e) => acc + (e.haber || 0), 0);
  const totalGastos     = allAccountEntries.reduce((acc, e) => acc + (e.debe  || 0), 0);
  const balance         = totalIngresos - totalGastos;
  const ingresosEsteMes = entriesThisMonth.reduce((acc, e) => acc + (e.haber || 0), 0);
  const gastosEsteMes   = entriesThisMonth.reduce((acc, e) => acc + (e.debe  || 0), 0);
  const balanceMes      = ingresosEsteMes - gastosEsteMes;
  const recentEntries   = allAccountEntries.slice(0, 5);

  // ─── HELPERS ────────────────────────────────────────────────
  const getDaysDiff = (date: Date) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const d = new Date(date); d.setHours(0,0,0,0);
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const vencidos   = upcomingEvents.filter(e => getDaysDiff(e.date) < 0);
  const hoy        = upcomingEvents.filter(e => getDaysDiff(e.date) === 0);
  const proximos3  = upcomingEvents.filter(e => getDaysDiff(e.date) > 0 && getDaysDiff(e.date) <= 3);
  const resto      = upcomingEvents.filter(e => getDaysDiff(e.date) > 3);
  const hayUrgencias = vencidos.length > 0 || hoy.length > 0 || proximos3.length > 0;

  return (
    <div className="flex-1 w-full p-4 md:p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto">

      <PageBreadcrumb items={[{ label: "Inicio" }]} />

      {/* ══════════════════════════════════════════════════════
          BARRA COMPACTA - reemplaza las 4 tarjetas KPI
          ══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-3 shadow-sm text-sm">

        <div className="flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-slate-700">
          <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="text-slate-500 dark:text-slate-400">Hoy</span>
          <span className="font-bold text-slate-900 dark:text-white">{now.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}</span>
        </div>

        <div className="flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-slate-700">
          <Users className="h-4 w-4 text-blue-500 shrink-0" />
          <span className="text-slate-500 dark:text-slate-400">Clientes</span>
          <span className="font-bold text-slate-900 dark:text-white">{totalClients}</span>
        </div>

        <div className="flex items-center gap-2 px-4 border-r border-slate-200 dark:border-slate-700">
          <Scale className="h-4 w-4 text-slate-500 shrink-0" />
          <span className="text-slate-500 dark:text-slate-400">Judiciales</span>
          <span className="font-bold text-slate-900 dark:text-white">{judicialCases}</span>
        </div>

        <div className="flex items-center gap-2 px-4 border-r border-slate-200 dark:border-slate-700">
          <FolderOpen className="h-4 w-4 text-indigo-500 shrink-0" />
          <span className="text-slate-500 dark:text-slate-400">Extrajudiciales</span>
          <span className="font-bold text-slate-900 dark:text-white">{extrajudicialCases}</span>
        </div>

        <div className="flex items-center gap-2 px-4 border-r border-slate-200 dark:border-slate-700">
          <CalendarDays className={`h-4 w-4 shrink-0 ${pendingEvents > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
          <span className="text-slate-500 dark:text-slate-400">Vencimientos</span>
          <span className={`font-bold ${pendingEvents > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
            {pendingEvents}
          </span>
        </div>

        {/* Saldo del mes — al extremo derecho */}
        <div className="flex items-center gap-2 px-4 ml-auto">
          <Wallet className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="text-slate-500 dark:text-slate-400">
            {now.toLocaleDateString('es-AR', { month: 'long' })}
          </span>
          <span className={`font-bold font-mono ${balanceMes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
            {balanceMes >= 0 ? '+' : ''}$ {balanceMes.toLocaleString("es-AR")}
          </span>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════
          SEMAFORO DE URGENCIAS
          ══════════════════════════════════════════════════════ */}
      {hayUrgencias && (
        <div className="space-y-2">

          {vencidos.map(evt => (
            <Link key={evt.id} href={`/client/${evt.case?.clientId}/case/${evt.case?.id}`}>
              <div className="flex items-center gap-4 bg-red-600 dark:bg-red-700 text-white rounded-xl px-5 py-3 hover:bg-red-700 transition-all shadow-md mb-2">
                <AlertTriangle className="h-5 w-5 shrink-0 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">VENCIDO</span>
                  <p className="font-bold truncate">{evt.title}</p>
                  <p className="text-xs opacity-75 truncate">{evt.case?.caratula} - {evt.case?.client?.lastName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono opacity-75">{new Date(evt.date).toLocaleDateString('es-AR')}</p>
                  <p className="text-sm font-bold">{Math.abs(getDaysDiff(evt.date))}d atras</p>
                </div>
                <ChevronRight className="h-4 w-4 opacity-60" />
              </div>
            </Link>
          ))}

          {hoy.map(evt => (
            <Link key={evt.id} href={`/client/${evt.case?.clientId}/case/${evt.case?.id}`}>
              <div className="flex items-center gap-4 bg-amber-500 dark:bg-amber-600 text-white rounded-xl px-5 py-3 hover:bg-amber-600 transition-all shadow-md mb-2">
                <Zap className="h-5 w-5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">HOY</span>
                  <p className="font-bold truncate">{evt.title}</p>
                  <p className="text-xs opacity-75 truncate">{evt.case?.caratula} - {evt.case?.client?.lastName}</p>
                </div>
                <p className="text-sm font-bold shrink-0">
                  {new Date(evt.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                </p>
                <ChevronRight className="h-4 w-4 opacity-60" />
              </div>
            </Link>
          ))}

          {proximos3.map(evt => (
            <Link key={evt.id} href={`/client/${evt.case?.clientId}/case/${evt.case?.id}`}>
              <div className="flex items-center gap-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-xl px-5 py-3 hover:border-orange-400 transition-all mb-2">
                <Clock className="h-5 w-5 shrink-0 text-orange-500" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
                    EN {getDaysDiff(evt.date)} DIA{getDaysDiff(evt.date) > 1 ? 'S' : ''}
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white truncate">{evt.title}</p>
                  <p className="text-xs text-slate-500 truncate">{evt.case?.caratula} - {evt.case?.client?.lastName}</p>
                </div>
                <p className="text-xs font-mono text-slate-500 shrink-0">{new Date(evt.date).toLocaleDateString('es-AR')}</p>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </Link>
          ))}

        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          GRILLA PRINCIPAL
          ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* COLUMNA IZQUIERDA (8/12) */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* AGENDA */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-500" /> Agenda
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resto.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                  <CheckCircle2 className="h-8 w-8 mb-2" />
                  <span className="font-medium">
                    {upcomingEvents.length === 0 ? 'Agenda despejada. Todo al dia.' : 'No hay mas eventos proximos.'}
                  </span>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {resto.map(evt => {
                    const days = getDaysDiff(evt.date);
                    return (
                      <Link key={evt.id} href={`/client/${evt.case?.clientId}/case/${evt.case?.id}`} className="group">
                        <div className="flex items-center gap-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-lg transition-colors">
                          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex flex-col items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                            <span className="text-[10px] font-bold uppercase text-blue-500">
                              {new Date(evt.date).toLocaleDateString('es-AR', { month: 'short' })}
                            </span>
                            <span className="text-xl font-extrabold text-blue-700 dark:text-blue-300 leading-none">
                              {new Date(evt.date).getDate()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded uppercase">
                                {evt.type === 'HEARING' ? 'Audiencia' : evt.type === 'DEADLINE' ? 'Plazo' : 'Reunion'}
                              </span>
                              <span className="text-[10px] text-slate-400">en {days} dias</span>
                            </div>
                            <p className="font-semibold text-slate-900 dark:text-white truncate">{evt.title}</p>
                            <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                              <Gavel className="h-3 w-3 shrink-0" /> {evt.case?.caratula}
                            </p>
                          </div>
                          <p className="text-xs font-mono text-slate-500 shrink-0">
                            {new Date(evt.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                          </p>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* DIRECTORIO DE CLIENTES */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm flex-1">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" /> Directorio de Clientes
                </CardTitle>
                <CreateClientDialog />
              </div>
              <div className="space-y-4">
                <SearchInput />
                <AreaFilter />
              </div>
            </CardHeader>
            <CardContent className="pt-4 p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {clients.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-slate-500 text-sm">
                    No se encontraron clientes.
                  </div>
                ) : (
                  clients.map((client) => (
                    <div key={client.id} className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-xl p-4 transition-all shadow-sm hover:shadow-md">
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DeleteButton id={client.id} type="CLIENT" />
                      </div>
                      <Link href={`/client/${client.id}`} className="block">
                        <h3 className="font-bold text-slate-900 dark:text-white pr-8 truncate">
                          {client.lastName}, {client.firstName}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 mb-3">
                          <Phone className="h-3 w-3" /> {client.phone || "Sin contacto"}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {client.cases.length === 0 && <span className="text-[10px] text-slate-400 italic">Sin carpetas</span>}
                          {client.cases.slice(0, 3).map((c, i) => (
                            <span key={i} className={`text-[9px] font-bold px-2 py-0.5 rounded text-white ${c.isExtrajudicial ? 'bg-indigo-500' : 'bg-slate-700 dark:bg-slate-600'}`}>
                              {c.isExtrajudicial ? 'EXTRAJUDICIAL' : (c.area || 'CIVIL')}
                            </span>
                          ))}
                          {client.cases.length > 3 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800">
                              +{client.cases.length - 3}
                            </span>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA DERECHA (4/12) */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* CAJA */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm border-t-4 border-t-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                Resumen contable <Wallet className="h-4 w-4 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Saldo general</p>
                <div className={`text-4xl font-extrabold tracking-tight ${balance >= 0 ? 'dark:text-white' : 'text-red-500'}`}>
                  {balance < 0 ? '-' : ''}$ {Math.abs(balance).toLocaleString("es-AR")}
                </div>
              </div>

              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-2">Totales historicos</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-emerald-500" /> Ingresos
                  </span>
                  <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    $ {totalIngresos.toLocaleString("es-AR")}
                  </span>
                </div>
                <div className="h-px w-full bg-slate-200 dark:bg-slate-700" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <TrendingDown className="h-4 w-4 text-red-500" /> Egresos
                  </span>
                  <span className="font-mono text-sm font-bold text-red-500">
                    $ {totalGastos.toLocaleString("es-AR")}
                  </span>
                </div>
              </div>

              <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <p className="text-[10px] font-bold uppercase text-blue-500 tracking-widest mb-2">
                  Este mes — {now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-emerald-500" /> Ingresos
                  </span>
                  <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    $ {ingresosEsteMes.toLocaleString("es-AR")}
                  </span>
                </div>
                <div className="h-px w-full bg-blue-100 dark:bg-blue-900/30" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <TrendingDown className="h-4 w-4 text-red-500" /> Egresos
                  </span>
                  <span className="font-mono text-sm font-bold text-red-500">
                    $ {gastosEsteMes.toLocaleString("es-AR")}
                  </span>
                </div>
                <div className="h-px w-full bg-blue-100 dark:bg-blue-900/30" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Resultado del mes</span>
                  <span className={`font-mono text-sm font-bold ${balanceMes >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500'}`}>
                    {balanceMes >= 0 ? '+' : ''}$ {balanceMes.toLocaleString("es-AR")}
                  </span>
                </div>
              </div>

              <Link href="/contabilidad" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2">
                  <BookOpen className="h-4 w-4" /> Ir a Contabilidad <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* MOVIMIENTOS RECIENTES */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm flex-1">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" /> Movimientos Recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentEntries.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8 italic">No hay actividad registrada.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {recentEntries.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`p-2 rounded-full shrink-0 ${entry.haber > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                          {entry.haber > 0
                            ? <TrendingUp className="h-4 w-4 text-emerald-600" />
                            : <TrendingDown className="h-4 w-4 text-red-600" />}
                        </div>
                        <div className="truncate pr-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{entry.description}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">
                            {new Date(entry.date).toLocaleDateString('es-AR')}
                            {entry.case && <span className="ml-1">- {entry.case.code}</span>}
                          </p>
                        </div>
                      </div>
                      <div className={`text-sm font-bold font-mono whitespace-nowrap ${entry.haber > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {entry.haber > 0 ? '+' : '-'}${Math.max(entry.haber, entry.debe).toLocaleString("es-AR")}
                      </div>
                    </div>
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
