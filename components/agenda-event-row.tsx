"use client";

import { AppointmentMode, AppointmentStatus, EventType } from "@prisma/client";
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
  MessageCircle,
} from "lucide-react";
import {
  deleteEvent,
  toggleAppointmentDeposit,
  updateAppointmentStatus,
} from "@/lib/actions/agenda";

export interface AgendaClientOption {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}

export interface AgendaEventContact {
  firstName: string;
  lastName: string;
  phone: string | null;
}

export interface AgendaEvent {
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

export const TYPE_CONFIG: Record<EventType, { icon: LucideIcon; color: string; label: string }> = {
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

export function getDaysDiff(dateValue: Date | string) {
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

export function EventRow({ event, onToggle, showDelete = true }: {
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
