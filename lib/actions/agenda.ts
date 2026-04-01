"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { deleteAgendaEventWithDeps, createAgendaEventWithDeps } from "@/lib/actions/services";

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
