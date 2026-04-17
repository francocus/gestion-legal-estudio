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
    async createEvent(data) {
      const createdEvent = await db.event.create({ data });

      if (
        data.type === "APPOINTMENT" &&
        data.depositPaid &&
        data.depositAmount &&
        data.depositAmount > 0
      ) {
        await db.accountEntry.create({
          data: {
            date: data.date,
            description: `Seña registrada para turno: ${data.title}`,
            concept: "Seña de turno",
            haber: data.depositAmount,
            debe: 0,
            caseId: data.caseId,
            appointmentId: createdEvent.id,
          },
        });
      }

      return createdEvent;
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
    async updateEvent(id, data) {
      const updatedEvent = await db.event.update({ where: { id }, data });

      if (!updatedEvent.depositAmount || updatedEvent.depositAmount <= 0) {
        return updatedEvent;
      }

      const existingEntry = await db.accountEntry.findUnique({
        where: { appointmentId: id },
      });

      if (data.depositPaid) {
        if (!existingEntry) {
          await db.accountEntry.create({
            data: {
              date: updatedEvent.date,
              description: `Seña registrada para turno: ${updatedEvent.title}`,
              concept: "Seña de turno",
              haber: updatedEvent.depositAmount,
              debe: 0,
              caseId: updatedEvent.caseId,
              appointmentId: updatedEvent.id,
            },
          });
        }
      } else if (existingEntry) {
        await db.accountEntry.delete({
          where: { appointmentId: id },
        });
      }

      return updatedEvent;
    },
    revalidatePath,
  });
}
