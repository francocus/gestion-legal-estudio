"use client";

import { useRef, useState } from "react";
import { EventType } from "@prisma/client";
import { createAgendaEvent, toggleEventStatus, deleteEvent } from "@/lib/actions/agenda";
import {
  Calendar,
  CheckCircle,
  Circle,
  Trash2,
  Clock,
  Briefcase,
  User,
  Stethoscope,
  Coffee,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgendaCaseOption {
  id: string;
  caratula: string;
}

interface AgendaEvent {
  id: string;
  title: string;
  date: Date | string;
  type: EventType;
  isDone: boolean;
  case?: {
    caratula: string;
  } | null;
}

const TYPE_CONFIG: Record<EventType, { icon: LucideIcon; color: string; label: string }> = {
  HEARING: { icon: Briefcase, color: "text-red-500 bg-red-100 dark:bg-red-900/20", label: "Audiencia" },
  DEADLINE: { icon: Clock, color: "text-orange-500 bg-orange-100 dark:bg-orange-900/20", label: "Vencimiento" },
  MEETING: { icon: Briefcase, color: "text-blue-500 bg-blue-100 dark:bg-blue-900/20", label: "Reunion" },
  PERSONAL: { icon: User, color: "text-purple-500 bg-purple-100 dark:bg-purple-900/20", label: "Personal" },
  MEDICAL: { icon: Stethoscope, color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20", label: "Medico" },
  SOCIAL: { icon: Coffee, color: "text-pink-500 bg-pink-100 dark:bg-pink-900/20", label: "Social" },
  OTHER: { icon: Calendar, color: "text-gray-500 bg-gray-100 dark:bg-gray-800", label: "Otro" },
};

export function AgendaPanel({ initialEvents, activeCases }: { initialEvents: AgendaEvent[]; activeCases: AgendaCaseOption[] }) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const pendingEvents = initialEvents.filter((event) => !event.isDone);
  const doneEvents = initialEvents.filter((event) => event.isDone);

  async function handleToggle(id: string, isDone: boolean) {
    await toggleEventStatus(id, !isDone);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm h-fit">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white">
          <Calendar className="h-5 w-5 text-indigo-500" />
          Nuevo evento
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
            setIsSaving(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-semibold text-gray-500">Titulo</label>
            <input
              required
              name="title"
              type="text"
              className="w-full mt-1 p-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-white"
              placeholder="Ej: Audiencia de conciliacion"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-gray-500">Fecha y hora</label>
              <input
                required
                name="date"
                type="datetime-local"
                className="w-full mt-1 p-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Tipo</label>
              <select
                required
                name="type"
                className="w-full mt-1 p-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm"
              >
                <optgroup label="Juridico">
                  <option value="HEARING">Audiencia</option>
                  <option value="DEADLINE">Vencimiento</option>
                  <option value="MEETING">Reunion con cliente</option>
                </optgroup>
                <optgroup label="Personal / Rutina">
                  <option value="PERSONAL">Personal</option>
                  <option value="MEDICAL">Medico</option>
                  <option value="SOCIAL">Social</option>
                  <option value="OTHER">Otro</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500">Expediente (opcional)</label>
            <select
              name="caseId"
              className="w-full mt-1 p-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm"
            >
              <option value="">Ninguno (evento independiente)</option>
              {activeCases.map((legalCase) => (
                <option key={legalCase.id} value={legalCase.id}>
                  {legalCase.caratula}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Agregar a la agenda"}
          </Button>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}
        </form>
      </div>

      <div className="md:col-span-2 space-y-6">
        <div>
          <h3 className="font-bold text-lg mb-3 dark:text-white">Proximos y pendientes</h3>
          {pendingEvents.length === 0 ? (
            <p className="text-sm text-gray-500">No hay tareas pendientes. Todo al dia.</p>
          ) : (
            <div className="space-y-2">
              {pendingEvents.map((event) => {
                const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.OTHER;
                const Icon = config.icon;
                return (
                  <div key={event.id} className="flex items-center gap-4 bg-white dark:bg-slate-950 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm group">
                    <button type="button" onClick={() => handleToggle(event.id, event.isDone)} className="text-gray-300 hover:text-green-500 transition-colors">
                      <Circle className="h-6 w-6" />
                    </button>
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-100">{event.title}</h4>
                      <div className="flex gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                        <span>{new Date(event.date).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</span>
                        <span>-</span>
                        <span className="font-medium">{config.label}</span>
                        {event.case && (
                          <>
                            <span>-</span>
                            <span className="truncate max-w-[150px] italic">Exp: {event.case.caratula}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={() => deleteEvent(event.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {doneEvents.length > 0 && (
          <div>
            <h3 className="font-bold text-lg mb-3 text-gray-400">Completados</h3>
            <div className="space-y-2 opacity-60">
              {doneEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-4 bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                  <button type="button" onClick={() => handleToggle(event.id, event.isDone)} className="text-green-500">
                    <CheckCircle className="h-6 w-6" />
                  </button>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-500 line-through">{event.title}</h4>
                  </div>
                  <button type="button" onClick={() => deleteEvent(event.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
