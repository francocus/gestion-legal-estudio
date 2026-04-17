"use client";

import { useState } from "react";
import { AppointmentMode, AppointmentStatus } from "@prisma/client";
import { CalendarClock, Save } from "lucide-react";
import { createAgendaEvent } from "@/lib/actions/agenda";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AppointmentCaseOption {
  id: string;
  caratula: string;
}

interface Props {
  clientId: string;
  caseId?: string;
  caseOptions?: AppointmentCaseOption[];
  triggerLabel?: string;
}

export function CreateAppointmentDialog({
  clientId,
  caseId,
  caseOptions = [],
  triggerLabel = "Nuevo turno",
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresDeposit, setRequiresDeposit] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set("type", "APPOINTMENT");
    formData.set("clientId", clientId);
    if (caseId) {
      formData.set("caseId", caseId);
    }

    const result = await createAgendaEvent(formData);
    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    setRequiresDeposit(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold gap-2 shadow-sm transition-all">
          <CalendarClock className="h-4 w-4" /> {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[560px] dark:bg-slate-950 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Nuevo turno</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="title" className="text-sm font-medium dark:text-gray-300">Motivo del turno <span className="text-red-500">*</span></label>
            <input
              id="title"
              name="title"
              required
              placeholder="Ej: Consulta inicial"
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="date" className="text-sm font-medium dark:text-gray-300">Fecha y hora <span className="text-red-500">*</span></label>
              <input
                id="date"
                name="date"
                type="datetime-local"
                required
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="durationMinutes" className="text-sm font-medium dark:text-gray-300">Duracion</label>
              <input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min="15"
                step="15"
                defaultValue="60"
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="appointmentMode" className="text-sm font-medium dark:text-gray-300">Modalidad</label>
              <select
                id="appointmentMode"
                name="appointmentMode"
                defaultValue={AppointmentMode.IN_PERSON}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              >
                <option value={AppointmentMode.IN_PERSON}>Presencial</option>
                <option value={AppointmentMode.PHONE}>Llamada</option>
                <option value={AppointmentMode.VIDEO}>Videollamada</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="appointmentStatus" className="text-sm font-medium dark:text-gray-300">Estado inicial</label>
              <select
                id="appointmentStatus"
                name="appointmentStatus"
                defaultValue={AppointmentStatus.PENDING}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              >
                <option value={AppointmentStatus.PENDING}>Pendiente</option>
                <option value={AppointmentStatus.CONFIRMED}>Confirmado</option>
              </select>
            </div>
          </div>

          {!caseId && caseOptions.length > 0 && (
            <div className="grid gap-2">
              <label htmlFor="caseId" className="text-sm font-medium dark:text-gray-300">Expediente (opcional)</label>
              <select
                id="caseId"
                name="caseId"
                defaultValue=""
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              >
                <option value="">Sin vincular</option>
                {caseOptions.map((legalCase) => (
                  <option key={legalCase.id} value={legalCase.id}>
                    {legalCase.caratula}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="rounded-xl border border-fuchsia-100 bg-fuchsia-50/60 p-4 dark:border-fuchsia-900/30 dark:bg-fuchsia-950/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-fuchsia-800 dark:text-fuchsia-300">Seña / reserva</p>
                <p className="mt-1 text-xs text-fuchsia-700/80 dark:text-fuchsia-200/80">
                  Activalo si el turno requiere anticipo.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-fuchsia-800 dark:text-fuchsia-200">
                <input
                  type="checkbox"
                  checked={requiresDeposit}
                  onChange={(e) => setRequiresDeposit(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-fuchsia-600"
                />
                Requiere seña
              </label>
            </div>

            {requiresDeposit && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label htmlFor="depositAmount" className="text-sm font-medium text-fuchsia-800 dark:text-fuchsia-200">
                    Monto de seña
                  </label>
                  <input
                    id="depositAmount"
                    name="depositAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    placeholder="Ej: 15000"
                  />
                </div>
                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-fuchsia-800 dark:text-fuchsia-200">
                    <input
                      name="depositPaid"
                      type="checkbox"
                      value="true"
                      className="h-4 w-4 rounded border-slate-300 text-fuchsia-600"
                    />
                    Seña ya pagada
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <label htmlFor="description" className="text-sm font-medium dark:text-gray-300">Observaciones</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Notas, documentacion a llevar, aclaraciones del turno..."
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold mt-2 gap-2">
            {loading ? "Guardando..." : (
              <>
                <Save className="h-4 w-4" /> Guardar turno
              </>
            )}
          </Button>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}

