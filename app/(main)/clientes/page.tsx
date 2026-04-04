import { db } from "@/lib/db";
import Link from "next/link";
import { CreateClientDialog } from "@/components/client-form";
import { SearchInput } from "@/components/search-input";
import { AreaFilter } from "@/components/area-filter";
import { DeleteButton } from "@/components/delete-button";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string; area?: string }>;
}

function getDaysDiff(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function ClientesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q || "";
  const area = params.area || undefined;

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

  const totalClients = clients.length;
  const clientsWithCases = clients.filter((client) => client.cases.length > 0).length;
  const clientsWithJudicialCases = clients.filter((client) =>
    client.cases.some((legalCase) => !legalCase.isExtrajudicial && legalCase.status !== "ARCHIVED")
  ).length;
  const clientsWithUpcomingDeadlines = clients.filter((client) =>
    client.cases.some((legalCase) => legalCase.events.some((event) => getDaysDiff(event.date) <= 7))
  ).length;

  return (
    <div className="flex-1 w-full p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
            Gestion de clientes
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Clientes
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
            Revisa tu cartera, filtra por area y entra rapido a la ficha de cada cliente con sus expedientes y vencimientos.
          </p>
        </div>
        <CreateClientDialog />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-4">
          <SearchInput />
          <AreaFilter />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {clients.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No se encontraron clientes con esos filtros.</p>
          </div>
        ) : (
          clients.map((client) => {
            const activeCases = client.cases.filter((legalCase) => legalCase.status !== "ARCHIVED");
            const judicialCases = activeCases.filter((legalCase) => !legalCase.isExtrajudicial);
            const extrajudicialCases = activeCases.filter((legalCase) => legalCase.isExtrajudicial);
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
                    <div className="flex flex-wrap gap-2 mb-3">
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
                        {nextEvent.legalCase.caratula} · {nextEvent.event.date.toLocaleDateString("es-AR")}
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
                  <Link href={`/client/${client.id}`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2">
                      Abrir ficha del cliente
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
