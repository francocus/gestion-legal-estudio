import { getOptionalString, getRequiredString } from "@/lib/actions/form-data";
import { parseCreateAgendaEventInput } from "@/lib/actions/parsers";
import { AppointmentMode, AppointmentStatus, EventType } from "@prisma/client";
import { ACTION_OK, actionError, ActionResult } from "@/lib/actions/action-result";
import { RevalidatePath } from "./types";

export async function createAgendaEventWithDeps(
  formData: FormData,
  deps: {
    createEvent(data: {
      title: string;
      date: Date;
      type: EventType;
      description: string;
      caseId: string | null;
      clientId: string | null;
      appointmentStatus: AppointmentStatus | null;
      appointmentMode: AppointmentMode | null;
      durationMinutes: number | null;
      depositAmount: number | null;
      depositPaid: boolean;
    }): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
): Promise<ActionResult> {
  const {
    title,
    dateStr,
    date,
    type,
    description,
    caseId,
    clientId,
    appointmentStatus,
    appointmentMode,
    durationMinutes,
    depositAmount,
    depositPaid,
  } = parseCreateAgendaEventInput(formData);

  if (!title || !dateStr || !type || Number.isNaN(date.getTime())) {
    return actionError("Faltan datos obligatorios del evento.");
  }

  if (type === "APPOINTMENT" && !clientId) {
    return actionError("Selecciona un cliente para el turno.");
  }

  await deps.createEvent({
    title,
    date,
    type,
    description,
    caseId,
    clientId,
    appointmentStatus,
    appointmentMode,
    durationMinutes: durationMinutes && Number.isFinite(durationMinutes) ? durationMinutes : null,
    depositAmount: depositAmount && Number.isFinite(depositAmount) && depositAmount > 0 ? depositAmount : null,
    depositPaid,
  });

  deps.revalidatePath("/agenda");
  deps.revalidatePath("/contabilidad");
  return ACTION_OK;
}

export async function updateAppointmentStatusWithDeps(
  formData: FormData,
  deps: {
    updateEvent(id: string, data: { appointmentStatus: AppointmentStatus }): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
): Promise<ActionResult> {
  const id = getRequiredString(formData, "id");
  const status = getRequiredString(formData, "status") as AppointmentStatus;

  if (!id || !status) {
    return actionError("No se pudo actualizar el estado del turno.");
  }

  await deps.updateEvent(id, { appointmentStatus: status });
  deps.revalidatePath("/agenda");
  return ACTION_OK;
}

export async function toggleAppointmentDepositWithDeps(
  formData: FormData,
  deps: {
    updateEvent(id: string, data: { depositPaid: boolean }): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
): Promise<ActionResult> {
  const id = getRequiredString(formData, "id");
  const depositPaid = getRequiredString(formData, "depositPaid") === "true";

  if (!id) {
    return actionError("No se pudo actualizar la seña.");
  }

  await deps.updateEvent(id, { depositPaid });
  deps.revalidatePath("/agenda");
  deps.revalidatePath("/contabilidad");
  return ACTION_OK;
}

export async function deleteAgendaEventWithDeps(
  formData: FormData,
  deps: {
    deleteEvent(id: string): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
) {
  const id = getRequiredString(formData, "id");
  const clientId = getOptionalString(formData, "clientId");
  const caseId = getOptionalString(formData, "caseId");

  if (!id) return;

  await deps.deleteEvent(id);

  deps.revalidatePath("/agenda");
  deps.revalidatePath("/");

  if (clientId && caseId) {
    deps.revalidatePath(`/client/${clientId}/case/${caseId}`);
  }
}
