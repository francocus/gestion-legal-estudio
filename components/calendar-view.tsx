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
  case?: { caratula: string; id: string; clientId: string } | null;
}

export function CalendarView({ events }: { events: Event[] }) {
  const router = useRouter();

  const calendarEvents = events.map((evt) => {
    let bgColor = "#3b82f6";
    if (evt.type === "HEARING") bgColor = "#ef4444";
    if (evt.type === "DEADLINE") bgColor = "#f59e0b";

    if (evt.isDone) bgColor = "#94a3b8";

    const endDate = new Date(evt.date);
    endDate.setHours(endDate.getHours() + 1);

    return {
      id: evt.id,
      title: `${evt.title} ${evt.case ? `(${evt.case.caratula})` : ""}`,
      start: evt.date,
      end: endDate,
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
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Los eventos vinculados a expedientes abren su detalle. Los eventos generales se gestionan desde la agenda central.</p>
      </div>

      <style>{`
        .fc {
          --fc-border-color: #cbd5e1;
          --fc-button-text-color: #1e293b;
          --fc-button-bg-color: #f8fafc;
          --fc-button-border-color: #cbd5e1;
          --fc-button-hover-bg-color: #e2e8f0;
          --fc-button-hover-border-color: #94a3b8;
          --fc-button-active-bg-color: #cbd5e1;
          --fc-button-active-border-color: #94a3b8;
          --fc-today-bg-color: #e0f2fe;
        }

        .dark .fc {
          --fc-border-color: #1e293b;
          --fc-page-bg-color: #0f172a;
          --fc-neutral-bg-color: #0f172a;
          --fc-button-text-color: #f8fafc;
          --fc-button-bg-color: #0f172a;
          --fc-button-border-color: #334155;
          --fc-button-hover-bg-color: #1e293b;
          --fc-button-hover-border-color: #475569;
          --fc-button-active-bg-color: #334155;
          --fc-button-active-border-color: #475569;
          --fc-today-bg-color: rgba(6, 78, 59, 0.4);
        }

        .fc-theme-standard th {
          background-color: #f8fafc;
          padding: 8px 0 !important;
          border-bottom: 2px solid #cbd5e1 !important;
        }
        .dark .fc-theme-standard th {
          background-color: #020617;
          border-bottom: 2px solid #1e293b !important;
        }

        .fc-event {
          cursor: pointer;
          border-radius: 4px;
          padding: 3px 6px;
          border: none !important;
          font-weight: 600;
          transition: transform 0.1s ease, box-shadow 0.1s ease;
        }
        .fc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.15), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }
        .fc-toolbar-title {
          font-size: 1.25rem !important;
          font-weight: 700 !important;
          text-transform: capitalize;
          color: #0f172a;
        }
        .dark .fc-toolbar-title {
          color: #f8fafc;
        }
        .fc a {
          text-decoration: none !important;
          color: inherit;
        }
        .fc-daygrid-day-number {
          font-size: 0.875rem;
          padding: 8px !important;
          font-weight: 500;
        }
        .fc-day-other .fc-daygrid-day-number {
          opacity: 0.4;
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
          dayMaxEvents
          height="100%"
        />
      </div>
    </div>
  );
}
