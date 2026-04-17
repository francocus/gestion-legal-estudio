import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CreateCaseDialog } from "@/components/create-case-dialog";
import { CreateAppointmentDialog } from "@/components/create-appointment-dialog";
import { EditClientDialog } from "@/components/edit-client-dialog";
import { DeleteButton } from "@/components/delete-button";
import {
  ChevronLeft,
  IdCard,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  AlertCircle,
  Folder,
  Gavel,
  Users,
  ShieldAlert,
  HeartHandshake,
  LayoutGrid,
  FileText,
  MessageCircle,
  FolderOpen,
  Landmark,
  CalendarClock,
  Clock3,
  Banknote,
  MessageSquareShare,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientPage({ params }: PageProps) {
  const { id } = await params;

  const client = await db.client.findUnique({
    where: { id },
    include: {
      events: {
        where: {
          type: "APPOINTMENT",
          isDone: false,
        },
        include: {
          case: {
            select: {
              id: true,
              caratula: true,
            },
          },
        },
        orderBy: { date: "asc" },
        take: 6,
      },
      cases: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              events: true,
              notes: true,
              legalSources: true,
              movements: true,
            },
          },
        },
      },
    },
  });

  if (!client) return notFound();

  const totalCases = client.cases.length;
  const activeCases = client.cases.filter((c) => c.status === "ACTIVE").length;
  const judicialCases = client.cases.filter((c) => !c.isExtrajudicial).length;
  const extrajudicialCases = client.cases.filter((c) => c.isExtrajudicial).length;
  const appointmentCaseOptions = client.cases.map((c) => ({ id: c.id, caratula: c.caratula }));
  const appointmentsWithDeposit = client.events.filter((evt) => typeof evt.depositAmount === "number" && evt.depositAmount > 0);
  const paidDeposits = appointmentsWithDeposit.filter((evt) => evt.depositPaid);
  const pendingDeposits = appointmentsWithDeposit.filter((evt) => !evt.depositPaid);
  const paidDepositAmount = paidDeposits.reduce((sum, evt) => sum + (evt.depositAmount || 0), 0);
  const pendingDepositAmount = pendingDeposits.reduce((sum, evt) => sum + (evt.depositAmount || 0), 0);

  return (
    <div className="w-full p-6 space-y-6 max-w-[1600px] mx-auto">
      <Link href="/">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white pl-0 flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Volver al tablero
        </Button>
      </Link>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {client.lastName}, {client.firstName}
              </h1>
              <EditClientDialog client={client} />
            </div>
            <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">
              {client.location || client.nationality || "Ficha general del cliente y sus expedientes."}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:min-w-[260px]">
            <CreateCaseDialog clientId={client.id} />
            <CreateAppointmentDialog
              clientId={client.id}
              caseOptions={appointmentCaseOptions}
              triggerLabel="Nuevo turno"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-gray-200 dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">Expedientes</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{totalCases}</p>
                </div>
                <div className="rounded-xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  <FolderOpen className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">Activos: {activeCases}</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">Judiciales</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{judicialCases}</p>
                </div>
                <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                  <Landmark className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">Con juzgado u organismo asociado.</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">Extrajudiciales</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{extrajudicialCases}</p>
                </div>
                <div className="rounded-xl bg-violet-100 p-3 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                  <HeartHandshake className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">Gestiones y acuerdos fuera de juicio.</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">Señas</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                    ${pendingDepositAmount.toLocaleString("es-AR")}
                  </p>
                </div>
                <div className="rounded-xl bg-fuchsia-100 p-3 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300">
                  <Banknote className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">
                Pendientes: {pendingDeposits.length} · Cobradas: {paidDeposits.length}
              </p>
            </CardContent>
          </Card>

        </div>

        <div className="bg-gray-50 dark:bg-slate-900/50 p-5 rounded-xl border border-gray-200 dark:border-slate-800 text-sm shadow-sm">
          <div className="flex flex-wrap items-center gap-6 mb-4 border-b pb-4 border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <IdCard className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Documento</p>
                <p className="font-bold text-gray-900 dark:text-gray-100">{client.docType} {client.dni || "---"}</p>
              </div>
            </div>

            {client.cuit && (
              <div className="flex items-center gap-2 border-l pl-6 border-gray-200 dark:border-slate-800">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">CUIT/CUIL</p>
                  <p className="text-gray-900 dark:text-gray-100 font-mono font-bold">{client.cuit}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 border-l pl-6 border-gray-200 dark:border-slate-800">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Nacimiento</p>
                <p className="text-gray-900 dark:text-gray-100">
                  <span className="font-bold">{client.birthDate ? client.birthDate.toLocaleDateString() : "-"}</span>
                  {client.birthPlace && <span className="text-gray-500 dark:text-gray-400 italic"> ({client.birthPlace})</span>}
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div>
                <p className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-500" /> Domicilio
                </p>
                <p className="text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-950 p-3 rounded border border-gray-200 dark:border-slate-800 shadow-sm font-medium">
                  {client.address || "Domicilio no cargado"}{client.location ? `, ${client.location}` : ""}
                </p>
              </div>

              {client.occupation && (
                <div>
                  <p className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-amber-500" /> Ocupacion
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-950 p-3 rounded border border-gray-200 dark:border-slate-800 shadow-sm font-medium">
                    {client.occupation}
                  </p>
                </div>
              )}
            </div>

            <div>
              <p className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-500" /> Contacto
              </p>
              <div className="text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-950 p-3 rounded border border-gray-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                    <Phone className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 dark:text-white">{client.phone || "Sin celular"}</span>
                    {client.phone && (
                      <a
                        href={`https://wa.me/549${client.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <MessageCircle className="h-3 w-3" /> Abrir WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                {client.email && (
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                      <Mail className="h-4 w-4 text-blue-500" />
                    </div>
                    <a href={`mailto:${client.email}`} className="text-blue-600 dark:text-blue-400 hover:underline overflow-hidden text-ellipsis font-medium">
                      {client.email}
                    </a>
                  </div>
                )}

                {client.familyPhone && (
                  <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-3">
                      <p className="text-xs font-bold text-red-500 dark:text-red-400 uppercase mb-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> En caso de urgencia
                      </p>
                      <div className="flex justify-between items-center gap-3">
                        <p className="text-red-700 dark:text-red-300 font-bold text-base">{client.familyPhone}</p>
                        <a
                          href={`https://wa.me/549${client.familyPhone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 font-bold transition-colors"
                        >
                          Enviar WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-fuchsia-100 bg-fuchsia-50/60 p-6 shadow-sm dark:border-fuchsia-900/30 dark:bg-fuchsia-950/20">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarClock className="h-6 w-6 text-fuchsia-500" /> Proximos turnos
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Turnos, confirmaciones y señas del cliente en el corto plazo.
            </p>
          </div>
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-700 dark:bg-slate-900/70 dark:text-fuchsia-300">
            {client.events.length} activos
          </span>
        </div>

        {appointmentsWithDeposit.length > 0 && (
          <div className="mb-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-fuchsia-100 bg-white/80 p-4 dark:border-fuchsia-900/30 dark:bg-slate-900/60">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Señas pendientes</p>
              <p className="mt-2 text-xl font-bold text-amber-600 dark:text-amber-400">${pendingDepositAmount.toLocaleString("es-AR")}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{pendingDeposits.length} turno(s) con anticipo pendiente</p>
            </div>
            <div className="rounded-xl border border-fuchsia-100 bg-white/80 p-4 dark:border-fuchsia-900/30 dark:bg-slate-900/60">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Señas cobradas</p>
              <p className="mt-2 text-xl font-bold text-emerald-600 dark:text-emerald-400">${paidDepositAmount.toLocaleString("es-AR")}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{paidDeposits.length} turno(s) con anticipo registrado</p>
            </div>
            <div className="rounded-xl border border-fuchsia-100 bg-white/80 p-4 dark:border-fuchsia-900/30 dark:bg-slate-900/60">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Turnos con seña</p>
              <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{appointmentsWithDeposit.length}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Con reserva asociada en agenda</p>
            </div>
          </div>
        )}

        {client.events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-fuchsia-200 bg-white/70 p-8 text-center text-sm text-fuchsia-700/70 dark:border-fuchsia-900/40 dark:bg-slate-950/30 dark:text-fuchsia-200/70">
            No hay turnos pendientes para este cliente.
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {client.events.map((evt) => (
              <Card key={evt.id} className="border-fuchsia-100 bg-white/90 dark:border-fuchsia-900/30 dark:bg-slate-900">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{evt.title}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5 text-fuchsia-500" />
                          {evt.date.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                        {evt.appointmentMode && (
                          <span className="rounded-full border border-fuchsia-200 px-2 py-0.5 font-semibold text-fuchsia-700 dark:border-fuchsia-900/30 dark:text-fuchsia-300">
                            {evt.appointmentMode === "IN_PERSON" ? "Presencial" : evt.appointmentMode === "PHONE" ? "Llamada" : "Videollamada"}
                          </span>
                        )}
                        {evt.appointmentStatus && (
                          <span className="rounded-full border border-slate-200 px-2 py-0.5 font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
                            {evt.appointmentStatus === "PENDING" ? "Pendiente" : evt.appointmentStatus === "CONFIRMED" ? "Confirmado" : evt.appointmentStatus}
                          </span>
                        )}
                      </div>
                    </div>
                    {evt.depositAmount ? (
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                        evt.depositPaid
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      }`}>
                        <Banknote className="h-3.5 w-3.5" />
                        ${evt.depositAmount.toLocaleString("es-AR")}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    {evt.case && (
                      <Link
                        href={`/client/${client.id}/case/${evt.case.id}`}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        <MessageSquareShare className="h-3.5 w-3.5" />
                        {evt.case.caratula}
                      </Link>
                    )}
                    {client.phone && (
                      <a
                        href={`https://wa.me/${client.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${client.firstName}, te recordamos tu turno \"${evt.title}\" para el ${evt.date.toLocaleString("es-AR", { dateStyle: "full", timeStyle: "short" })}.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Recordar por WhatsApp
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 dark:text-white">
          <Folder className="h-6 w-6 text-blue-500" /> Expedientes
          <span className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">{client.cases.length}</span>
        </h2>

        {client.cases.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl p-10 text-center text-gray-500 dark:text-gray-400">
            <LayoutGrid className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Carpeta vacia.</p>
            <p className="text-sm">Usa el boton azul para iniciar un expediente.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {client.cases.map((c) => {
              const iconMap = {
                FAMILIA: { icon: Users, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-900/20", border: "border-pink-100 dark:border-pink-900" },
                PENAL: { icon: ShieldAlert, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-100 dark:border-red-900" },
                LABORAL: { icon: Briefcase, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-100 dark:border-emerald-900" },
                PREVISIONAL: { icon: HeartHandshake, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-100 dark:border-amber-900" },
                CIVIL: { icon: Gavel, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-100 dark:border-blue-900" },
                ADMINISTRATIVO: { icon: FileText, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/20", border: "border-slate-100 dark:border-slate-800" },
              };
              const areaInfo = iconMap[c.area as keyof typeof iconMap] || iconMap.CIVIL;
              const AreaIcon = areaInfo.icon;

              return (
                <Card key={c.id} className="hover:shadow-lg transition-all border-l-4 border-l-blue-600 h-full relative group dark:bg-slate-900 dark:border-y-slate-800 dark:border-r-slate-800 dark:border-l-blue-500">
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DeleteButton id={c.id} type="CASE" clientId={client.id} />
                  </div>

                  <Link href={`/client/${client.id}/case/${c.id}`} className="block h-full">
                    <CardHeader className="pb-2 pt-4 pr-10">
                      <CardTitle className="text-lg font-bold text-blue-900 dark:text-blue-300 leading-tight">{c.caratula}</CardTitle>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-tighter">Exp: {c.code || "Sin numero"}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2 font-medium italic">
                        <Gavel className="h-4 w-4 text-slate-400" /> {c.juzgado || (c.isExtrajudicial ? "Gestion extrajudicial" : "Sin organismo cargado")}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40">
                          <p className="font-bold uppercase tracking-wide">Actividad</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{c._count.movements}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40">
                          <p className="font-bold uppercase tracking-wide">Agenda</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{c._count.events}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40">
                          <p className="font-bold uppercase tracking-wide">Notas</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{c._count.notes}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40">
                          <p className="font-bold uppercase tracking-wide">Biblioteca</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{c._count.legalSources}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-widest ${
                          c.status === "ACTIVE"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900"
                            : c.status === "MEDIATION"
                              ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900"
                              : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700"
                        }`}>
                          {c.status === "ACTIVE" ? "En tramite" : c.status === "MEDIATION" ? "Mediacion" : "Archivado"}
                        </span>

                        <span className="text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-widest bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                          {c.isExtrajudicial ? "Extrajudicial" : "Judicial"}
                        </span>

                        {c.area && (
                          <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase flex items-center gap-1 ${areaInfo.bg} ${areaInfo.color} ${areaInfo.border} tracking-widest`}>
                            <AreaIcon className="h-3 w-3" />
                            {c.area}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
