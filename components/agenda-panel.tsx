"use client";

import { useMemo, useRef, useState } from "react";
import { AppointmentMode, AppointmentStatus, EventType } from "@prisma/client";
import {
  createAgendaEvent,
  deleteEvent,
  toggleAppointmentDeposit,
  toggleEventStatus,
  updateAppointmentStatus,
} from "@/lib/actions/agenda";
import {
  Calendar,
  CalendarClock,
  CheckCircle,
  Circle,
  Banknote,
  BellRing,
  Trash2,
  Clock,
  Briefcase,
  User,
  Stethoscope,
  Coffee,
  type LucideIcon,
  Funnel,
  Search,
  ArrowDownUp,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgendaCaseOption {
  id: string;
  caratula: string;
}

interface AgendaClientOption {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}

interface AgendaEventContact {
  firstName: string;
  lastName: string;
  phone: string | null;
}

interface AgendaEvent {
  id: string;
  title: string;
  date: Date | string;
  type: EventType;
  isDone: boolean;
  appointmentStatus?: AppointmentStatus | null;
  appointmentMode?: AppointmentMode | null;
  durationMinutes?: number | null;
  depositAmount?: number | null;
  depositPaid?: boolean;
  client?: AgendaClientOption | null;
  case?: {
    caratula: string;
    client?: AgendaEventContact | null;
  } | null;
}

const TYPE_CONFIG: Record<EventType, { icon: LucideIcon; color: string; label: string }> = {
  HEARING: { icon: Briefcase, color: "text-red-500 bg-red-100 dark:bg-red-900/20", label: "Audiencia" },
  DEADLINE: { icon: Clock, color: "text-orange-500 bg-orange-100 dark:bg-orange-900/20", label: "Vencimiento" },
  MEETING: { icon: Briefcase, color: "text-blue-500 bg-blue-100 dark:bg-blue-900/20", label: "Reunion" },
  APPOINTMENT: { icon: CalendarClock, color: "text-fuchsia-500 bg-fuchsia-100 dark:bg-fuchsia-900/20", label: "Turno" },
  PERSONAL: { icon: User, color: "text-purple-500 bg-purple-100 dark:bg-purple-900/20", label: "Personal" },
  MEDICAL: { icon: Stethoscope, color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20", label: "Medico" },
  SOCIAL: { icon: Coffee, color: "text-pink-500 bg-pink-100 dark:bg-pink-900/20", label: "Social" },
  OTHER: { icon: Calendar, color: "text-gray-500 bg-gray-100 dark:bg-gray-800", label: "Otro" },
};

const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Realizado",
  CANCELLED: "Cancelado",
  NO_SHOW: "Ausente",
};

const APPOINTMENT_MODE_LABELS: Record<AppointmentMode, string> = {
  IN_PERSON: "Presencial",
  PHONE: "Llamada",
  VIDEO: "Videollamada",
};

function getDaysDiff(dateValue: Date | string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateValue);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatPhoneForWhatsApp(phone?: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}

function buildAppointmentReminderMessage(event: AgendaEvent, reminderKind: "dayBefore" | "sameDay") {
  const contactClient = event.client ?? event.case?.client;
  const clientName = contactClient ? `${contactClient.firstName} ${contactClient.lastName}`.trim() : "cliente";
  const dateLabel = new Date(event.date).toLocaleString("es-AR", {
    dateStyle: "full",
    timeStyle: "short",
  });
  const modeLabel =
    event.appointmentMode && APPOINTMENT_MODE_LABELS[event.appointmentMode]
      ? APPOINTMENT_MODE_LABELS[event.appointmentMode]
      : "turno";

  const opening =
    reminderKind === "dayBefore"
      ? `Hola ${clientName}, te recordamos tu turno de manana.`
      : `Hola ${clientName}, te recordamos tu turno de hoy.`;

  return [
    opening,
    `Motivo: ${event.title}.`,
    `Fecha y hora: ${dateLabel}.`,
    `Modalidad: ${modeLabel}.`,
    event.depositAmount
      ? `Sena: ${event.depositPaid ? "ya registrada" : `pendiente por $${event.depositAmount.toLocaleString("es-AR")}`}.`
      : null,
    "Cualquier cambio, por favor avisarnos por este medio.",
  ]
    .filter(Boolean)
    .join(" ");
}

function buildWhatsAppUrl(phone: string, message: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

async function submitAppointmentStatus(id: string, status: AppointmentStatus) {
  const formData = new FormData();
  formData.append("id", id);
  formData.append("status", status);
  await updateAppointmentStatus(formData);
}

async function submitDepositStatus(id: string, depositPaid: boolean) {
  const formData = new FormData();
  formData.append("id", id);
  formData.append("depositPaid", String(depositPaid));
  await toggleAppointmentDeposit(formData);
}

function EventRow({ event, onToggle, showDelete = true }: {
  event: AgendaEvent;
  onToggle: (id: string, isDone: boolean) => Promise<void>;
  showDelete?: boolean;
}) {
  const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.OTHER;
  const Icon = config.icon;
  const days = getDaysDiff(event.date);
  const isOverdue = !event.isDone && days < 0;
  const isToday = !event.isDone && days === 0;
  const isSoon = !event.isDone && days > 0 && days <= 3;
  const contactClient = event.client ?? event.case?.client;
  const whatsappPhone = formatPhoneForWhatsApp(contactClient?.phone);
  const isAppointment = event.type === "APPOINTMENT";

  return (
    <div className={`group rounded-xl border p-4 shadow-sm transition-colors ${
      isOverdue
        ? "border-red-200 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/20"
        : isToday
          ? "border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20"
          : isSoon
            ? "border-blue-200 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/20"
            : "border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-950"
    }`}>
      <div className="flex items-start gap-4">
        <button type="button" onClick={() => onToggle(event.id, event.isDone)} className="mt-1 text-gray-300 hover:text-green-500 transition-colors">
          {event.isDone ? <CheckCircle className="h-6 w-6 text-green-500" /> : <Circle className="h-6 w-6" />}
        </button>
        <div className={`rounded-lg p-2 ${config.color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className={`font-semibold ${event.isDone ? "text-gray-500 line-through" : "text-gray-800 dark:text-gray-100"}`}>
                {event.title}
              </h4>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                <span>{new Date(event.date).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</span>
                <span>-</span>
                <span className="font-medium">{config.label}</span>
                {isAppointment && event.appointmentStatus && (
                  <>
                    <span>-</span>
                    <span className="font-medium text-fuchsia-600 dark:text-fuchsia-300">{APPOINTMENT_STATUS_LABELS[event.appointmentStatus]}</span>
                  </>
                )}
                {isAppointment && event.appointmentMode && (
                  <>
                    <span>-</span>
                    <span>{APPOINTMENT_MODE_LABELS[event.appointmentMode]}</span>
                  </>
                )}
                {!event.isDone && days === 0 && <span>- Hoy</span>}
                {!event.isDone && days > 0 && days <= 3 && <span>- En {days} dia{days > 1 ? "s" : ""}</span>}
                {!event.isDone && days < 0 && <span className="text-red-500">- Vencido</span>}
                {event.case && (
                  <>
                    <span>-</span>
                    <span className="truncate max-w-[220px] italic">{event.case.caratula}</span>
                  </>
                )}
                {contactClient && (
                  <>
                    <span>-</span>
                    <span>{contactClient.lastName}, {contactClient.firstName}</span>
                  </>
                )}
                {isAppointment && typeof event.durationMinutes === "number" && event.durationMinutes > 0 && (
                  <>
                    <span>-</span>
                    <span>{event.durationMinutes} min</span>
                  </>
                )}
              </div>
            </div>
            {showDelete && (
              <button type="button" onClick={() => deleteEvent(event.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>

          {isAppointment && event.depositAmount ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                event.depositPaid
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              }`}>
                <Banknote className="h-3.5 w-3.5" />
                Sena {event.depositPaid ? "pagada" : "pendiente"} - ${event.depositAmount.toLocaleString("es-AR")}
              </span>
              <button
                type="button"
                onClick={() => submitDepositStatus(event.id, !event.depositPaid)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {event.depositPaid ? "Marcar pendiente" : "Marcar pagada"}
              </button>
            </div>
          ) : null}

          {isAppointment && (
            <div className="mt-3 flex flex-wrap gap-2">
              {event.appointmentStatus !== "CONFIRMED" && (
                <button
                  type="button"
                  onClick={() => submitAppointmentStatus(event.id, "CONFIRMED")}
                  className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300"
                >
                  Confirmar
                </button>
              )}
              {event.appointmentStatus !== "COMPLETED" && (
                <button
                  type="button"
                  onClick={() => submitAppointmentStatus(event.id, "COMPLETED")}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300"
                >
                  Marcar realizado
                </button>
              )}
              {event.appointmentStatus !== "CANCELLED" && (
                <button
                  type="button"
                  onClick={() => submitAppointmentStatus(event.id, "CANCELLED")}
                  className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300"
                >
                  Cancelar
                </button>
              )}
              {event.appointmentStatus !== "NO_SHOW" && (
                <button
                  type="button"
                  onClick={() => submitAppointmentStatus(event.id, "NO_SHOW")}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Ausente
                </button>
              )}
              {whatsappPhone && (
                <>
                  <a
                    href={buildWhatsAppUrl(whatsappPhone, buildAppointmentReminderMessage(event, "dayBefore"))}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Recordar dia anterior
                  </a>
                  <a
                    href={buildWhatsAppUrl(whatsappPhone, buildAppointmentReminderMessage(event, "sameDay"))}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-xs font-semibold text-fuchsia-700 transition hover:bg-fuchsia-100 dark:border-fuchsia-900/40 dark:bg-fuchsia-950/30 dark:text-fuchsia-300"
                  >
                    <BellRing className="h-3.5 w-3.5" />
                    Recordar hoy
                  </a>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AgendaPanel({
  initialEvents,
  activeCases,
  activeClients,
}: {
  initialEvents: AgendaEvent[];
  activeCases: AgendaCaseOption[];
  activeClients: AgendaClientOption[];
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "URGENT" | "CASE" | "APPOINTMENT" | "PERSONAL" | "DONE">("ALL");
  const [rangeFilter, setRangeFilter] = useState<"ALL" | "TODAY" | "WEEK" | "MONTH">("ALL");
  const [sortBy, setSortBy] = useState<"DATE_ASC" | "DATE_DESC" | "PRIORITY">("PRIORITY");
  const [searchTerm, setSearchTerm] = useState("");
  const [eventType, setEventType] = useState<EventType>("DEADLINE");
  const [requiresDeposit, setRequiresDeposit] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const pendingEvents = initialEvents.filter((event) => !event.isDone);
  const doneEvents = initialEvents.filter((event) => event.isDone);
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredPendingEvents = useMemo(() => {
    const base =
      (() => {
        switch (filter) {
      case "URGENT":
          return pendingEvents.filter((event) => getDaysDiff(event.date) <= 3);
      case "CASE":
          return pendingEvents.filter((event) => Boolean(event.case));
      case "APPOINTMENT":
          return pendingEvents.filter((event) => event.type === "APPOINTMENT");
      case "PERSONAL":
          return pendingEvents.filter((event) => ["PERSONAL", "MEDICAL", "SOCIAL", "OTHER"].includes(event.type));
      default:
          return pendingEvents;
        }
      })();

    const withRange = base.filter((event) => {
      const days = getDaysDiff(event.date);

      switch (rangeFilter) {
        case "TODAY":
          return days === 0;
        case "WEEK":
          return days >= 0 && days <= 7;
        case "MONTH":
          return days >= 0 && days <= 30;
        default:
          return true;
      }
    });

    const withSearch = !normalizedSearch
      ? withRange
      : withRange.filter((event) => {
          const haystack = [
            event.title,
            event.case?.caratula,
            event.client?.firstName,
            event.client?.lastName,
            event.case?.client?.firstName,
            event.case?.client?.lastName,
            TYPE_CONFIG[event.type]?.label,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(normalizedSearch);
        });

    return [...withSearch].sort((left, right) => {
      const leftDate = new Date(left.date).getTime();
      const rightDate = new Date(right.date).getTime();

      if (sortBy === "DATE_ASC") {
        return leftDate - rightDate;
      }

      if (sortBy === "DATE_DESC") {
        return rightDate - leftDate;
      }

      const leftDays = getDaysDiff(left.date);
      const rightDays = getDaysDiff(right.date);
      const leftPriority = leftDays < 0 ? 0 : leftDays === 0 ? 1 : leftDays <= 3 ? 2 : 3;
      const rightPriority = rightDays < 0 ? 0 : rightDays === 0 ? 1 : rightDays <= 3 ? 2 : 3;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return leftDate - rightDate;
    });
  }, [filter, normalizedSearch, pendingEvents, rangeFilter, sortBy]);

  const filteredDoneEvents = useMemo(() => {
    const withRange = doneEvents.filter((event) => {
      const days = getDaysDiff(event.date);

      switch (rangeFilter) {
        case "TODAY":
          return days === 0;
        case "WEEK":
          return days >= 0 && days <= 7;
        case "MONTH":
          return days >= 0 && days <= 30;
        default:
          return true;
      }
    });

    const withSearch = !normalizedSearch
      ? withRange
      : withRange.filter((event) => {
          const haystack = [
            event.title,
            event.case?.caratula,
            event.client?.firstName,
            event.client?.lastName,
            event.case?.client?.firstName,
            event.case?.client?.lastName,
            TYPE_CONFIG[event.type]?.label,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(normalizedSearch);
        });

    return [...withSearch].sort((left, right) => {
      const leftDate = new Date(left.date).getTime();
      const rightDate = new Date(right.date).getTime();

      if (sortBy === "DATE_DESC") {
        return rightDate - leftDate;
      }

      return leftDate - rightDate;
    });
  }, [doneEvents, normalizedSearch, rangeFilter, sortBy]);

  const overdueEvents = filteredPendingEvents.filter((event) => getDaysDiff(event.date) < 0);
  const todayEvents = filteredPendingEvents.filter((event) => getDaysDiff(event.date) === 0);
  const nextEvents = filteredPendingEvents.filter((event) => getDaysDiff(event.date) > 0);

  const pendingUrgentCount = pendingEvents.filter((event) => getDaysDiff(event.date) <= 3).length;
  const pendingCaseCount = pendingEvents.filter((event) => Boolean(event.case)).length;
  const pendingAppointmentCount = pendingEvents.filter((event) => event.type === "APPOINTMENT").length;
  const pendingPersonalCount = pendingEvents.filter((event) => ["PERSONAL", "MEDICAL", "SOCIAL", "OTHER"].includes(event.type)).length;
  const todayRangeCount = pendingEvents.filter((event) => getDaysDiff(event.date) === 0).length;
  const weekRangeCount = pendingEvents.filter((event) => {
    const days = getDaysDiff(event.date);
    return days >= 0 && days <= 7;
  }).length;
  const monthRangeCount = pendingEvents.filter((event) => {
    const days = getDaysDiff(event.date);
    return days >= 0 && days <= 30;
  }).length;
  const hearingCount = pendingEvents.filter((event) => event.type === "HEARING").length;
  const deadlineCount = pendingEvents.filter((event) => event.type === "DEADLINE").length;
  const meetingCount = pendingEvents.filter((event) => event.type === "MEETING").length;
  const appointmentCount = pendingEvents.filter((event) => event.type === "APPOINTMENT").length;
  const personalFlowCount = pendingEvents.filter((event) => ["PERSONAL", "MEDICAL", "SOCIAL"].includes(event.type)).length;
  const depositPendingCount = pendingEvents.filter((event) => event.type === "APPOINTMENT" && (event.depositAmount ?? 0) > 0 && !event.depositPaid).length;

  async function handleToggle(id: string, isDone: boolean) {
    await toggleEventStatus(id, !isDone);
  }

  const filterButtons = [
    { id: "ALL", label: "Todos", count: pendingEvents.length },
    { id: "URGENT", label: "Urgentes", count: pendingUrgentCount },
    { id: "APPOINTMENT", label: "Turnos", count: pendingAppointmentCount },
    { id: "CASE", label: "Con expediente", count: pendingCaseCount },
    { id: "PERSONAL", label: "Personales", count: pendingPersonalCount },
    { id: "DONE", label: "Completados", count: doneEvents.length },
  ] as const;

  const rangeButtons = [
    { id: "ALL", label: "Todo", count: pendingEvents.length },
    { id: "TODAY", label: "Hoy", count: todayRangeCount },
    { id: "WEEK", label: "Esta semana", count: weekRangeCount },
    { id: "MONTH", label: "Este mes", count: monthRangeCount },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[460px_minmax(0,1fr)]">
      <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
        <div className="h-fit rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold dark:text-white">
            <Calendar className="h-5 w-5 text-indigo-500" />
            Nuevo evento o turno
          </h3>
          <form
            ref={formRef}
            action={async (formData) => {
              setIsSaving(true);
              setError(null);
              const result = await createAgendaEvent(formData);
              if (!result.success) {
                setError(result.error);
                setIsSaving(false);
                return;
              }
              formRef.current?.reset();
              setEventType("DEADLINE");
              setRequiresDeposit(false);
              setIsSaving(false);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-500">Tipo <span className="text-red-500">*</span></label>
                <select
                  required
                  name="type"
                  value={eventType}
                  onChange={(event) => setEventType(event.target.value as EventType)}
                  className="mt-1 w-full rounded-md border p-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <optgroup label="Juridico / estudio">
                    <option value="HEARING">Audiencia</option>
                    <option value="DEADLINE">Vencimiento</option>
                    <option value="MEETING">Reunion / gestion</option>
                    <option value="APPOINTMENT">Turno</option>
                  </optgroup>
                  <optgroup label="Personal / rutina">
                    <option value="PERSONAL">Personal</option>
                    <option value="MEDICAL">Medico</option>
                    <option value="SOCIAL">Social</option>
                    <option value="OTHER">Otro</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Fecha y hora <span className="text-red-500">*</span></label>
                <input
                  required
                  name="date"
                  type="datetime-local"
                  className="mt-1 w-full rounded-md border p-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500">Titulo <span className="text-red-500">*</span></label>
              <input
                required
                name="title"
                type="text"
                className="mt-1 w-full rounded-md border p-2 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                placeholder={eventType === "APPOINTMENT" ? "Ej: Consulta inicial" : "Ej: Audiencia de conciliacion"}
              />
            </div>

            {eventType === "APPOINTMENT" ? (
              <>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Cliente <span className="text-red-500">*</span></label>
                  <select
                    name="clientId"
                    required
                    defaultValue=""
                    className="mt-1 w-full rounded-md border p-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="" disabled>Seleccionar cliente...</option>
                    {activeClients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.lastName}, {client.firstName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Modalidad</label>
                    <select
                      name="appointmentMode"
                      defaultValue="IN_PERSON"
                      className="mt-1 w-full rounded-md border p-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="IN_PERSON">Presencial</option>
                      <option value="PHONE">Llamada</option>
                      <option value="VIDEO">Videollamada</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Estado inicial</label>
                    <select
                      name="appointmentStatus"
                      defaultValue="PENDING"
                      className="mt-1 w-full rounded-md border p-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="PENDING">Pendiente</option>
                      <option value="CONFIRMED">Confirmado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Duracion (min)</label>
                    <input
                      name="durationMinutes"
                      type="number"
                      min="15"
                      step="15"
                      defaultValue="60"
                      className="mt-1 w-full rounded-md border p-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Expediente (opcional)</label>
                    <select
                      name="caseId"
                      defaultValue=""
                      className="mt-1 w-full rounded-md border p-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="">Sin vincular</option>
                      {activeCases.map((legalCase) => (
                        <option key={legalCase.id} value={legalCase.id}>
                          {legalCase.caratula}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50/60 p-4 dark:border-fuchsia-900/30 dark:bg-fuchsia-950/20">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-700 dark:text-fuchsia-300">
                        Sena / reserva
                      </div>
                      <p className="mt-1 text-sm text-fuchsia-700/80 dark:text-fuchsia-200/80">
                        Carga la sena si este turno requiere reserva previa.
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-fuchsia-700 dark:text-fuchsia-200">
                      <input
                        type="checkbox"
                        checked={requiresDeposit}
                        onChange={(event) => setRequiresDeposit(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-500"
                      />
                      Requiere sena
                    </label>
                  </div>

                  {requiresDeposit ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-fuchsia-700 dark:text-fuchsia-200">Monto de sena</label>
                        <input
                          name="depositAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          className="mt-1 w-full rounded-md border p-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                          placeholder="Ej: 15000"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-fuchsia-700 dark:text-fuchsia-200">
                          <input
                            name="depositPaid"
                            type="checkbox"
                            value="true"
                            className="h-4 w-4 rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-500"
                          />
                          Sena ya pagada
                        </label>
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div>
                <label className="text-xs font-semibold text-gray-500">Expediente (opcional)</label>
                <select
                  name="caseId"
                  defaultValue=""
                  className="mt-1 w-full rounded-md border p-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">Ninguno (evento independiente)</option>
                  {activeCases.map((legalCase) => (
                    <option key={legalCase.id} value={legalCase.id}>
                      {legalCase.caratula}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-500">Descripcion / notas</label>
              <textarea
                name="description"
                rows={3}
                className="mt-1 w-full rounded-md border p-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                placeholder={eventType === "APPOINTMENT" ? "Observaciones, documentacion, aclaraciones del turno..." : "Notas internas del evento..."}
              />
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isSaving}>
              {isSaving ? "Guardando..." : eventType === "APPOINTMENT" ? "Guardar turno" : "Agregar a la agenda"}
            </Button>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}
          </form>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
            <Clock className="h-4 w-4 text-indigo-500" />
            Radar rapido
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Audiencias</div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{hearingCount}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Vencimientos</div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{deadlineCount}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Reuniones</div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{meetingCount}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Turnos</div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{appointmentCount}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Personales</div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{personalFlowCount}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Senas pendientes</div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{depositPendingCount}</div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-4 dark:border-indigo-900/40 dark:from-indigo-950/30 dark:to-blue-950/20">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
              En foco
            </div>
            <div className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              {todayRangeCount > 0
                ? `Tenes ${todayRangeCount} compromiso${todayRangeCount > 1 ? "s" : ""} para hoy, ${pendingAppointmentCount} turno${pendingAppointmentCount !== 1 ? "s" : ""} activo${pendingAppointmentCount !== 1 ? "s" : ""} y ${depositPendingCount} sena${depositPendingCount !== 1 ? "s" : ""} pendiente${depositPendingCount !== 1 ? "s" : ""}.`
                : `No hay compromisos para hoy. Quedan ${pendingUrgentCount} evento${pendingUrgentCount !== 1 ? "s" : ""} urgente${pendingUrgentCount !== 1 ? "s" : ""}, ${pendingAppointmentCount} turno${pendingAppointmentCount !== 1 ? "s" : ""} y ${depositPendingCount} sena${depositPendingCount !== 1 ? "s" : ""} pendiente${depositPendingCount !== 1 ? "s" : ""}.`}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
            <Funnel className="h-4 w-4 text-blue-500" />
            Bandeja operativa
          </div>
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por titulo, expediente o cliente..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-blue-600"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filterButtons.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                  filter === item.id
                    ? "border-transparent bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <span>{item.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  filter === item.id
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200"
                }`}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <div>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Rango rapido
              </div>
              <div className="flex flex-wrap gap-2">
                {rangeButtons.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRangeFilter(item.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                      rangeFilter === item.id
                        ? "border-transparent bg-slate-900 text-white dark:bg-blue-600"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      rangeFilter === item.id
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200"
                    }`}>
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                <ArrowDownUp className="h-3.5 w-3.5 text-indigo-500" />
                Orden
              </div>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as "DATE_ASC" | "DATE_DESC" | "PRIORITY")}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-blue-600"
              >
                <option value="PRIORITY">Por prioridad y fecha</option>
                <option value="DATE_ASC">Fecha mas cercana primero</option>
                <option value="DATE_DESC">Fecha mas lejana primero</option>
              </select>
            </div>
          </div>
        </div>

        {filter === "DONE" ? (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Completados</h3>
            {filteredDoneEvents.length === 0 ? (
              <p className="text-sm text-gray-500">Todavia no hay eventos completados.</p>
            ) : (
              filteredDoneEvents.map((event) => <EventRow key={event.id} event={event} onToggle={handleToggle} showDelete={true} />)
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-lg font-bold text-red-600 dark:text-red-400">Vencidos</h3>
              {overdueEvents.length === 0 ? (
                <p className="text-sm text-gray-500">No hay eventos vencidos en esta vista.</p>
              ) : (
                <div className="space-y-2">
                  {overdueEvents.map((event) => <EventRow key={event.id} event={event} onToggle={handleToggle} />)}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-lg font-bold text-amber-600 dark:text-amber-400">Hoy</h3>
              {todayEvents.length === 0 ? (
                <p className="text-sm text-gray-500">No hay compromisos para hoy en esta vista.</p>
              ) : (
                <div className="space-y-2">
                  {todayEvents.map((event) => <EventRow key={event.id} event={event} onToggle={handleToggle} />)}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">Proximos</h3>
              {nextEvents.length === 0 ? (
                <p className="text-sm text-gray-500">No hay proximos eventos en esta vista.</p>
              ) : (
                <div className="space-y-2">
                  {nextEvents.map((event) => <EventRow key={event.id} event={event} onToggle={handleToggle} />)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

