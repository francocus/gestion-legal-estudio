import { db } from "@/lib/db";
import { AgendaPanel } from "@/components/agenda-panel";
import { CalendarView } from "@/components/calendar-view";
import { AlertTriangle, CalendarDays, Clock3, Users } from "lucide-react";

export const dynamic = "force-dynamic";

function getDaysDiff(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function AgendaPage() {
  const events = await db.event.findMany({
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      case: {
        select: {
          caratula: true,
          id: true,
          clientId: true,
          client: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      },
    },
    orderBy: { date: "asc" },
  });

  const activeCases = await db.case.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      caratula: true,
    },
  });

  const activeClients = await db.client.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
    },
  });

  const pendingEvents = events.filter((event) => !event.isDone);
  const todayEvents = pendingEvents.filter((event) => getDaysDiff(event.date) === 0).length;
  const upcomingThreeDays = pendingEvents.filter((event) => {
    const days = getDaysDiff(event.date);
    return days > 0 && days <= 3;
  }).length;
  const overdueEvents = pendingEvents.filter((event) => getDaysDiff(event.date) < 0).length;
  const linkedToCases = pendingEvents.filter((event) => Boolean(event.caseId)).length;
  const appointments = pendingEvents.filter((event) => event.type === "APPOINTMENT").length;

  return (
    <div className="w-full p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-4 border-b pb-6 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-600 p-2 text-white shadow-sm">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Agenda del estudio</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Organiza vencimientos, audiencias, reuniones y compromisos personales en una sola vista de trabajo.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <CalendarDays className="h-4 w-4 text-blue-500" /> Hoy
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">{todayEvents}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Clock3 className="h-4 w-4 text-amber-500" /> Proximos 3 dias
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">{upcomingThreeDays}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <AlertTriangle className="h-4 w-4 text-red-500" /> Vencidos
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">{overdueEvents}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Users className="h-4 w-4 text-emerald-500" /> Vinculados a expedientes
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">{linkedToCases}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Users className="h-4 w-4 text-fuchsia-500" /> Turnos
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">{appointments}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wider">
          <span className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-red-500" /> Audiencias</span>
          <span className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-amber-500" /> Plazos / vencimientos</span>
          <span className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-blue-500" /> Reuniones / gestion</span>
          <span className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-fuchsia-500" /> Turnos</span>
          <span className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-purple-500" /> Personal</span>
          <span className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-emerald-500" /> Medico</span>
          <span className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-pink-500" /> Social</span>
          <span className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-slate-400" /> Completados</span>
        </div>
      </div>

      <AgendaPanel initialEvents={events} activeCases={activeCases} activeClients={activeClients} />
      <CalendarView events={events} />
    </div>
  );
}
