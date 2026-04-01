import { db } from "@/lib/db";
import { CalendarView } from "@/components/calendar-view";
import { CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  // Buscamos TODOS los eventos del estudio, ordenados por fecha
  const events = await db.event.findMany({
    include: {
      case: { select: { caratula: true, id: true, clientId: true } }
    },
    orderBy: { date: "asc" }
  });

  return (
    <div className="w-full p-6 space-y-6 max-w-[1600px] mx-auto">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b dark:border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Agenda del Estudio</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Gestión de audiencias, vencimientos y reuniones.
            </p>
          </div>
        </div>
        
        {/* Usamos tu modal existente para crear eventos generales */}
        <div className="flex gap-2">
          {/* Aquí podrías agregar un botón que abra un modal de creación de evento sin expediente */}
        </div>
      </div>

      {/* REFERENCIA DE COLORES */}
      <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wider">
        <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Audiencias</span>
        <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Plazos / Vencimientos</span>
        <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Reuniones</span>
        <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-400"></div> Completados</span>
      </div>

      

      {/* EL CALENDARIO GIGANTE */}
      <CalendarView events={events} />
      
    </div>
  );
}
