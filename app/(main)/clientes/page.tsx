import { db } from "@/lib/db";
import Link from "next/link";
import { CreateClientDialog } from "@/components/client-form";
import { CreateAppointmentDialog } from "@/components/create-appointment-dialog";
import { SearchInput } from "@/components/search-input";
import { AreaFilter } from "@/components/area-filter";
import { DeleteButton } from "@/components/delete-button";
import { Button } from "@/components/ui/button";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import {
  Users,
  Phone,
  FolderOpen,
  CalendarDays,
  ArrowRight,
  Scale,
  AlertTriangle,
  Clock3,
  MapPin,
  CalendarClock,
  MessageCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string; area?: string; turnos?: string }>;
}

function getDaysDiff(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function isSameDay(date: Date, target: Date) {
  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  );
}

export default async function ClientesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q || "";
  const area = params.area || undefined;
  const turnsFilter = params.turnos || "";

  let caseCondition = {};
  if (area === "EXTRAJUDICIAL") {
    caseCondition = { cases: { some: { isExtrajudicial: true } } };
  } else if (area) {
    caseCondition = { cases: { some: { area, isExtrajudicial: false } } };
  }

  const clients = await db.client.findMany({
    where: {
      AND: [
        {
          OR: [
            { lastName: { contains: query, mode: "insensitive" } },
            { firstName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
          ],
        },
        caseCondition,
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      events: {
        where: {
          type: "APPOINTMENT",
          isDone: false,
        },
        orderBy: { date: "asc" },
        take: 3,
      },
      cases: {
        orderBy: { createdAt: "desc" },
        include: {
          events: {
            where: { isDone: false },
            orderBy: { date: "asc" },
            take: 1,
          },
        },
      },
    },
  });

  const filteredClients =
    turnsFilter === "upcoming"
      ? clients.filter((client) => client.events.length > 0)
      : clients;

  const totalClients = filteredClients.length;
  const clientsWithCases = filteredClients.filter((client) => client.cases.length > 0).length;
  const clientsWithJudicialCases = filteredClients.filter((client) =>
    client.cases.some((legalCase) => !legalCase.isExtrajudicial && legalCase.status !== "ARCHIVED")
  ).length;
  const clientsWithUpcomingDeadlines = filteredClients.filter((client) =>
    client.cases.some((legalCase) => legalCase.events.some((event) => getDaysDiff(event.date) <= 7))
  ).length;
  const clientsWithUpcomingAppointments = filteredClients.filter((client) => client.events.length > 0).length;

  const today = new Date();
  const todayAppointments = filteredClients
    .flatMap((client) =>
      client.events
        .filter((event) => isSameDay(event.date, today))
        .map((event) => ({ client, event }))
    )
    .sort((a, b) => a.event.date.getTime() - b.event.date.getTime());

  const createTurnosUrl = (value?: string) => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (area) next.set("area", area);
    if (value) next.set("turnos", value);
    const queryString = next.toString();
    return queryString ? `/clientes?${queryString}` : "/clientes";
  };

  return (
    <div className="flex-1 w-full p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <PageBreadcrumb items={[{ label: "Clientes", href: "/clientes" }]} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
            Gestion de clientes
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Clientes
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
            Revisa tu cartera, filtra por area y entra rapido a la ficha de cada cliente con sus expedientes, turnos y vencimientos.
          </p>
        </div>
        <CreateClientDialog />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Users className="h-4 w-4 text-blue-500" /> Total de clientes
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">{totalClients}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <FolderOpen className="h-4 w-4 text-indigo-500" /> Con expedientes
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">{clientsWithCases}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Scale className="h-4 w-4 text-emerald-500" /> Judiciales activos
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">{clientsWithJudicialCases}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <CalendarDays className="h-4 w-4 text-amber-500" /> Con vencimientos proximos
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">{clientsWithUpcomingDeadlines}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <CalendarClock className="h-4 w-4 text-fuchsia-500" /> Con turnos proximos
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">{clientsWithUpcomingAppointments}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-4">
          <SearchInput />
          <AreaFilter />
          <div className="flex flex-wrap items-center gap-2">
            <Link href={createTurnosUrl()}>
              <Button
                variant={!turnsFilter ? "default" : "outline"}
                size="sm"
                className={`rounded-full h-8 px-3 text-xs border ${!turnsFilter ? "bg-fuchsia-600 hover:bg-fuchsia-700 text-white border-transparent" : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              >
                <CalendarClock className="mr-1.5 h-3.5 w-3.5" /> Todos los clientes
              </Button>
            </Link>
            <Link href={createTurnosUrl("upcoming")}>
              <Button
                variant={turnsFilter === "upcoming" ? "default" : "outline"}
                size="sm"
                className={`rounded-full h-8 px-3 text-xs border ${turnsFilter === "upcoming" ? "bg-fuchsia-600 hover:bg-fuchsia-700 text-white border-transparent" : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              >
                <Clock3 className="mr-1.5 h-3.5 w-3.5" /> Con turnos proximos
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50/60 p-5 shadow-sm dark:border-fuchsia-900/30 dark:bg-fuchsia-950/20">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
              <CalendarClock className="h-5 w-5 text-fuchsia-500" /> Turnos de hoy
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Vista rapida de las atenciones del dia para entrar directo al cliente correspondiente.
            </p>
          </div>
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-700 dark:bg-slate-900/70 dark:text-fuchsia-300">
            {todayAppointments.length}
          </span>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-fuchsia-200 bg-white/70 p-6 text-center text-sm text-fuchsia-700/70 dark:border-fuchsia-900/40 dark:bg-slate-950/30 dark:text-fuchsia-200/70">
            No hay turnos para hoy con los filtros actuales.
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {todayAppointments.map(({ client, event }) => (
              <Link
                key={event.id}
                href={`/client/${client.id}`}
                className="rounded-xl border border-fuchsia-100 bg-white/90 p-4 transition hover:border-fuchsia-300 hover:shadow-sm dark:border-fuchsia-900/30 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{event.title}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {client.lastName}, {client.firstName}
                    </p>
                  </div>
                  <span className="rounded-full bg-fuchsia-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300">
                    {event.date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  {event.appointmentMode && (
                    <span className="rounded-full border border-fuchsia-200 px-2 py-0.5 font-semibold text-fuchsia-700 dark:border-fuchsia-900/30 dark:text-fuchsia-300">
                      {event.appointmentMode === "IN_PERSON" ? "Presencial" : event.appointmentMode === "PHONE" ? "Llamada" : "Videollamada"}
                    </span>
                  )}
                  {client.phone && (
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5 text-emerald-500" /> {client.phone}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredClients.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No se encontraron clientes con esos filtros.</p>
          </div>
        ) : (
          filteredClients.map((client) => {
            const activeCases = client.cases.filter((legalCase) => legalCase.status !== "ARCHIVED");
            const judicialCases = activeCases.filter((legalCase) => !legalCase.isExtrajudicial);
            const extrajudicialCases = activeCases.filter((legalCase) => legalCase.isExtrajudicial);
            const nextAppointment = client.events[0] || null;
            const nextEvent = activeCases
              .flatMap((legalCase) =>
                legalCase.events.map((event) => ({
                  event,
                  legalCase,
                }))
              )
              .sort((a, b) => a.event.date.getTime() - b.event.date.getTime())[0];

            return (
              <article
                key={client.id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {judicialCases.length > 0 && (
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          Judicial {judicialCases.length}
                        </span>
                      )}
                      {extrajudicialCases.length > 0 && (
                        <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                          Extrajudicial {extrajudicialCases.length}
                        </span>
                      )}
                      {nextAppointment && (
                        <span className="rounded-full bg-fuchsia-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300">
                          Turno proximo
                        </span>
                      )}
                      {nextEvent && getDaysDiff(nextEvent.event.date) <= 3 && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          Atencion pronta
                        </span>
                      )}
                    </div>
                    <Link href={`/client/${client.id}`} className="block">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight pr-10">
                        {client.lastName}, {client.firstName}
                      </h2>
                    </Link>
                    <div className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-emerald-500" />
                        {client.phone || "Sin telefono cargado"}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {client.location || client.address || "Ubicacion no cargada"}
                      </p>
                    </div>
                  </div>
                  <DeleteButton id={client.id} type="CLIENT" />
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Activos</p>
                    <p className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">{activeCases.length}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Judiciales</p>
                    <p className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">{judicialCases.length}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Extrajud.</p>
                    <p className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">{extrajudicialCases.length}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  {nextAppointment && (
                    <div className="mb-4 rounded-xl border border-fuchsia-100 bg-white/90 p-3 dark:border-fuchsia-900/30 dark:bg-slate-950/40">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-300">
                        <CalendarClock className="h-4 w-4" />
                        Proximo turno
                      </div>
                      <p className="mt-2 font-semibold text-slate-900 dark:text-white">{nextAppointment.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {nextAppointment.date.toLocaleDateString("es-AR")} - {nextAppointment.date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  )}

                  {nextEvent ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {getDaysDiff(nextEvent.event.date) <= 0 ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Clock3 className="h-4 w-4 text-amber-500" />
                        )}
                        Proximo compromiso
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white">{nextEvent.event.title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {nextEvent.legalCase.caratula} - {nextEvent.event.date.toLocaleDateString("es-AR")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <CalendarDays className="h-4 w-4 text-slate-400" />
                        Seguimiento
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white">Sin vencimientos proximos</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Este cliente no tiene eventos pendientes en sus expedientes activos.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <CreateAppointmentDialog
                      clientId={client.id}
                      caseOptions={client.cases.map((legalCase) => ({
                        id: legalCase.id,
                        caratula: legalCase.caratula,
                      }))}
                      triggerLabel="Nuevo turno"
                    />
                    <Link href={`/client/${client.id}`}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2">
                        Abrir ficha
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
