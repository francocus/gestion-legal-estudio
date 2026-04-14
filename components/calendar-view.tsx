"use client";

import FullCalendar from "@fullcalendar/react";
import type { EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { useRouter } from "next/navigation";
import { EventType } from "@prisma/client";
import { Info } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: Date;
  type: EventType;
  isDone: boolean;
  client?: { firstName: string; lastName: string } | null;
  case?: { caratula: string; id: string; clientId: string } | null;
}

export function CalendarView({ events }: { events: Event[] }) {
  const router = useRouter();

  const calendarEvents = events.map((evt) => {
    let bgColor = "#3b82f6";
    if (evt.type === "HEARING") bgColor = "#ef4444";
    if (evt.type === "DEADLINE") bgColor = "#f59e0b";
    if (evt.type === "APPOINTMENT") bgColor = "#d946ef";

    if (evt.isDone) bgColor = "#94a3b8";

    return {
      id: evt.id,
      title: `${evt.title} ${evt.case ? `(${evt.case.caratula})` : evt.client ? `(${evt.client.lastName}, ${evt.client.firstName})` : ""}`,
      start: evt.date,
      backgroundColor: bgColor,
      borderColor: bgColor,
      extendedProps: {
        caseId: evt.case?.id,
        clientId: evt.case?.clientId,
        type: evt.type,
      },
    };
  });

  const handleEventClick = (clickInfo: EventClickArg) => {
    const props = clickInfo.event.extendedProps as { caseId?: string; clientId?: string };
    if (props.caseId && props.clientId) {
      router.push(`/client/${props.clientId}/case/${props.caseId}`);
      return;
    }

    const title = encodeURIComponent(clickInfo.event.title);
    router.push(`/agenda?evento=${title}`);
  };

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-900/50 dark:from-sky-950/30 dark:to-blue-950/20 dark:text-sky-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Los eventos vinculados a expedientes abren su detalle. Los eventos generales se gestionan desde la agenda central.</p>
      </div>

      <style>{`
        .fc {
          --fc-border-color: #dbe3f0;
          --fc-button-text-color: #0f172a;
          --fc-button-bg-color: #ffffff;
          --fc-button-border-color: #cbd5e1;
          --fc-button-hover-bg-color: #eff6ff;
          --fc-button-hover-border-color: #93c5fd;
          --fc-button-active-bg-color: #2563eb;
          --fc-button-active-border-color: #2563eb;
          --fc-today-bg-color: #eff6ff;
        }

        .dark .fc {
          --fc-border-color: #1e293b;
          --fc-page-bg-color: #0f172a;
          --fc-neutral-bg-color: #0f172a;
          --fc-button-text-color: #f8fafc;
          --fc-button-bg-color: #111827;
          --fc-button-border-color: #334155;
          --fc-button-hover-bg-color: #1e3a8a;
          --fc-button-hover-border-color: #3b82f6;
          --fc-button-active-bg-color: #2563eb;
          --fc-button-active-border-color: #2563eb;
          --fc-today-bg-color: rgba(30, 64, 175, 0.22);
        }

        .fc .fc-toolbar {
          gap: 1rem;
          margin-bottom: 1.25rem !important;
        }

        .fc .fc-toolbar.fc-header-toolbar {
          align-items: center;
        }

        .fc .fc-button {
          border-radius: 0.85rem !important;
          box-shadow: none !important;
          font-weight: 700 !important;
          padding: 0.55rem 0.95rem !important;
          text-transform: none !important;
        }

        .fc .fc-button-primary:not(:disabled).fc-button-active,
        .fc .fc-button-primary:not(:disabled):active {
          color: white !important;
        }

        .fc-theme-standard th {
          background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
          padding: 12px 0 !important;
          border-bottom: 1px solid #cbd5e1 !important;
        }
        .dark .fc-theme-standard th {
          background: linear-gradient(180deg, #020617 0%, #0f172a 100%);
          border-bottom: 1px solid #1e293b !important;
        }

        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: #d9e2f2 !important;
        }

        .dark .fc-theme-standard td,
        .dark .fc-theme-standard th {
          border-color: #233047 !important;
        }

        .fc-event {
          cursor: pointer;
          border-radius: 10px;
          padding: 4px 8px;
          border: none !important;
          font-weight: 600;
          transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease;
          box-shadow: 0 8px 20px -18px rgba(15, 23, 42, 0.9);
        }
        .fc-event:hover {
          transform: translateY(-1px);
          filter: brightness(1.05);
          box-shadow: 0 10px 24px -16px rgba(15, 23, 42, 0.9);
        }
        .fc-toolbar-title {
          font-size: 1.8rem !important;
          font-weight: 800 !important;
          text-transform: capitalize;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .dark .fc-toolbar-title {
          color: #f8fafc;
        }
        .fc a {
          text-decoration: none !important;
          color: inherit;
        }
        .fc-daygrid-day-number {
          font-size: 0.98rem;
          padding: 10px !important;
          font-weight: 800;
        }
        .fc-day-other .fc-daygrid-day-number {
          opacity: 0.28;
        }

        .fc .fc-daygrid-day-frame {
          min-height: 124px;
          padding-top: 0.3rem;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 30%);
        }

        .dark .fc .fc-daygrid-day-frame {
          background:
            linear-gradient(180deg, rgba(148, 163, 184, 0.04) 0%, rgba(15, 23, 42, 0) 26%);
        }

        .fc .fc-daygrid-day.fc-day-today {
          box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.35);
        }

        .fc .fc-daygrid-day-top {
          justify-content: space-between;
          align-items: flex-start;
          padding: 0.35rem 0.4rem 0 0.4rem;
        }

        .fc .fc-daygrid-day-number {
          min-width: 2.2rem;
          min-height: 2.2rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          border-radius: 9999px;
          margin: 0.1rem;
          color: #0f172a !important;
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 10px 20px -18px rgba(15, 23, 42, 0.9);
        }

        .dark .fc .fc-daygrid-day-number {
          color: #f8fafc !important;
          background: rgba(15, 23, 42, 0.92);
          box-shadow: 0 10px 20px -18px rgba(15, 23, 42, 0.95);
        }

        .fc .fc-day-today .fc-daygrid-day-number {
          background: #2563eb;
          color: white !important;
          box-shadow: 0 8px 18px -14px rgba(37, 99, 235, 0.95);
        }

        .fc .fc-daygrid-day-events {
          margin-top: 0.35rem;
          padding: 0 0.35rem 0.35rem;
        }

        .fc .fc-daygrid-event-harness {
          margin-top: 0.3rem;
        }

        .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-frame {
          background: linear-gradient(180deg, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0.02) 100%);
        }

        .fc .fc-daygrid-day.fc-day-past .fc-daygrid-day-frame {
          background-color: rgba(15, 23, 42, 0.015);
        }

        .dark .fc .fc-daygrid-day.fc-day-past .fc-daygrid-day-frame {
          background-color: rgba(148, 163, 184, 0.02);
        }

        .fc .fc-col-header-cell-cushion {
          padding: 0.75rem 0;
          font-size: 1.05rem;
          font-weight: 800;
        }

        .fc .fc-daygrid-more-link {
          font-weight: 700;
          color: #2563eb;
          padding-left: 0.2rem;
        }

        .dark .fc .fc-daygrid-more-link {
          color: #93c5fd;
        }

        .fc .fc-daygrid-event {
          margin: 0 !important;
        }

        .fc .fc-daygrid-event .fc-event-main {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fc .fc-timegrid-axis-cushion,
        .fc .fc-timegrid-slot-label-cushion {
          font-weight: 600;
        }
      `}</style>

      <div className="h-[700px] w-full fc-theme-standard">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={esLocale}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          buttonText={{
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Dia",
          }}
          events={calendarEvents}
          eventClick={handleEventClick}
          nowIndicator
          defaultTimedEventDuration="01:00:00"
          dayMaxEvents
          nextDayThreshold="09:00:00"
          height="100%"
        />
      </div>
    </div>
  );
}
