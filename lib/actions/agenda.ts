"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  createAgendaEventWithDeps,
  deleteAgendaEventWithDeps,
  toggleAppointmentDepositWithDeps,
  updateAppointmentStatusWithDeps,
} from "@/lib/actions/services";

export async function createAgendaEvent(formData: FormData) {
  return createAgendaEventWithDeps(formData, {
    createEvent(data) {
      return db.event.create({ data });
    },
    revalidatePath,
  });
}

export async function toggleEventStatus(id: string, isDone: boolean) {
  await db.event.update({
    where: { id },
    data: { isDone }
  });
  revalidatePath("/agenda");
}

export async function deleteEvent(id: string) {
  await db.event.delete({ where: { id } });
  revalidatePath("/agenda");
}

export async function deleteAgendaEvent(formData: FormData) {
  return deleteAgendaEventWithDeps(formData, {
    deleteEvent(id) {
      return db.event.delete({ where: { id } });
    },
    revalidatePath,
  });
}

export async function updateAppointmentStatus(formData: FormData) {
  return updateAppointmentStatusWithDeps(formData, {
    updateEvent(id, data) {
      const shouldClose = data.appointmentStatus === "COMPLETED" || data.appointmentStatus === "CANCELLED" || data.appointmentStatus === "NO_SHOW";
      return db.event.update({
        where: { id },
        data: {
          ...data,
          isDone: shouldClose,
        },
      });
    },
    revalidatePath,
  });
}

export async function toggleAppointmentDeposit(formData: FormData) {
  return toggleAppointmentDepositWithDeps(formData, {
    updateEvent(id, data) {
      return db.event.update({ where: { id }, data });
    },
    revalidatePath,
  });
}
