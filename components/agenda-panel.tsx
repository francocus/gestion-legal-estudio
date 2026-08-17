"use client";

import { useMemo, useRef, useState } from "react";
import { EventType } from "@prisma/client";
import { createAgendaEvent, toggleEventStatus } from "@/lib/actions/agenda";
import { Calendar, Clock, Funnel, Search, ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AgendaEvent,
  AgendaClientOption,
  EventRow,
  getDaysDiff,
  TYPE_CONFIG,
} from "@/components/agenda-event-row";

interface AgendaCaseOption {
  id: string;
  caratula: string;
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
  const [appointmentFilter, setAppointmentFilter] = useState<"ALL" | "PENDING" | "CONFIRMED" | "DEPOSIT_PENDING">("ALL");
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

    const withAppointmentFilter =
      appointmentFilter === "ALL"
        ? withSearch
        : withSearch.filter((event) => {
            if (event.type !== "APPOINTMENT") return false;
            if (appointmentFilter === "DEPOSIT_PENDING") {
              return (event.depositAmount ?? 0) > 0 && !event.depositPaid;
            }
            return event.appointmentStatus === appointmentFilter;
          });

    return [...withAppointmentFilter].sort((left, right) => {
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
  }, [appointmentFilter, filter, normalizedSearch, pendingEvents, rangeFilter, sortBy]);

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
  const appointmentPendingCount = pendingEvents.filter((event) => event.type === "APPOINTMENT" && event.appointmentStatus === "PENDING").length;
  const appointmentConfirmedCount = pendingEvents.filter((event) => event.type === "APPOINTMENT" && event.appointmentStatus === "CONFIRMED").length;
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
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Confirmados</div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{appointmentConfirmedCount}</div>
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
          {filter === "APPOINTMENT" && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
              {[
                { id: "ALL", label: "Todos", count: appointmentCount },
                { id: "PENDING", label: "Pendientes", count: appointmentPendingCount },
                { id: "CONFIRMED", label: "Confirmados", count: appointmentConfirmedCount },
                { id: "DEPOSIT_PENDING", label: "Señas pendientes", count: depositPendingCount },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAppointmentFilter(item.id as typeof appointmentFilter)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                    appointmentFilter === item.id
                      ? "border-transparent bg-fuchsia-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                    appointmentFilter === item.id
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  }`}>
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          )}
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

