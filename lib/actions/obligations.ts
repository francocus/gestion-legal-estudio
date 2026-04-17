"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { EventType, ObligationCategory, ObligationStatus } from "@prisma/client";
import { getOptionalString, getRequiredString, getStringWithDefault } from "@/lib/actions/form-data";

function parseLocalDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function buildObligationEventDescription(input: {
  country: string;
  organism: string;
  period?: string | null;
  notes?: string | null;
}) {
  const parts = [
    `Pais: ${input.country}`,
    `Organismo: ${input.organism}`,
    input.period ? `Periodo: ${input.period}` : null,
    input.notes ? `Observaciones: ${input.notes}` : null,
  ].filter(Boolean);

  return parts.join(" - ");
}

function shouldCloseObligationEvent(status: ObligationStatus) {
  return status === "PAID" || status === "FILED" || status === "CANCELLED";
}

function buildAccountingDescription(concept: string, organism: string, period?: string | null) {
  return [`Pago de obligacion`, concept, organism, period ? `Periodo ${period}` : null]
    .filter(Boolean)
    .join(" - ");
}

function revalidateObligationPaths(clientId: string, caseId?: string | null) {
  revalidatePath("/obligaciones");
  revalidatePath("/agenda");
  revalidatePath("/contabilidad");
  revalidatePath(`/client/${clientId}`);

  if (caseId) {
    revalidatePath(`/client/${clientId}/case/${caseId}`);
  }
}

export async function createObligation(formData: FormData) {
  const clientId = getRequiredString(formData, "clientId");
  const rawCaseId = getOptionalString(formData, "caseId");
  const country = getStringWithDefault(formData, "country", "Argentina");
  const organism = getRequiredString(formData, "organism");
  const category = getRequiredString(formData, "category") as ObligationCategory;
  const concept = getRequiredString(formData, "concept");
  const period = getOptionalString(formData, "period");
  const dueDateRaw = getRequiredString(formData, "dueDate");
  const amountRaw = getOptionalString(formData, "amount");
  const status = (getStringWithDefault(formData, "status", "PENDING") as ObligationStatus) || "PENDING";
  const notes = getOptionalString(formData, "notes");
  const caseId = rawCaseId && rawCaseId !== "NONE" ? rawCaseId : null;

  if (!clientId || !organism || !concept || !dueDateRaw || !category) {
    return { success: false as const, error: "Faltan datos obligatorios de la obligacion." };
  }

  const dueDate = parseLocalDate(dueDateRaw);
  if (Number.isNaN(dueDate.getTime())) {
    return { success: false as const, error: "La fecha de vencimiento no es valida." };
  }

  const parsedAmount = amountRaw ? Number(amountRaw) : null;
  if (amountRaw && (parsedAmount === null || !Number.isFinite(parsedAmount) || parsedAmount < 0)) {
    return { success: false as const, error: "El monto de la obligacion no es valido." };
  }
  const amount = parsedAmount;

  const event = await db.event.create({
    data: {
      title: `Vence ${concept}`,
      date: dueDate,
      type: EventType.DEADLINE,
      description: buildObligationEventDescription({ country, organism, period, notes }),
      caseId,
      clientId,
      isDone: shouldCloseObligationEvent(status),
    },
  });

  let paymentEntryId: string | null = null;
  if (status === "PAID" && amount !== null && amount > 0) {
    const entry = await db.accountEntry.create({
      data: {
        date: dueDate,
        description: buildAccountingDescription(concept, organism, period),
        concept: "Impuestos",
            debe: amount,
            haber: 0,
            caseId,
      },
    });
    paymentEntryId = entry.id;
  }

  await db.obligation.create({
    data: {
      clientId,
      caseId,
      country,
      organism,
      category,
      concept,
      period: period || null,
      dueDate,
      amount,
      status,
      notes: notes || null,
      eventId: event.id,
      paymentEntryId,
    },
  });

  revalidateObligationPaths(clientId, caseId);
  return { success: true as const };
}

export async function updateObligationStatus(formData: FormData) {
  const id = getRequiredString(formData, "id");
  const status = getRequiredString(formData, "status") as ObligationStatus;

  if (!id || !status) {
    return { success: false as const, error: "No se pudo actualizar la obligacion." };
  }

  const obligation = await db.obligation.findUnique({
    where: { id },
    include: {
      paymentEntry: true,
    },
  });

  if (!obligation) {
    return { success: false as const, error: "La obligacion ya no existe." };
  }

  let paymentEntryId = obligation.paymentEntryId;

  if (status === "PAID") {
    if (!paymentEntryId && obligation.amount && obligation.amount > 0) {
      const entry = await db.accountEntry.create({
        data: {
          date: obligation.dueDate,
          description: buildAccountingDescription(obligation.concept, obligation.organism, obligation.period),
          concept: "Impuestos",
          debe: obligation.amount,
          haber: 0,
          caseId: obligation.caseId,
        },
      });
      paymentEntryId = entry.id;
    }
  } else if (paymentEntryId) {
    await db.accountEntry.delete({
      where: { id: paymentEntryId },
    });
    paymentEntryId = null;
  }

  await db.obligation.update({
    where: { id },
    data: {
      status,
      paymentEntryId,
    },
  });

  if (obligation.eventId) {
    await db.event.update({
      where: { id: obligation.eventId },
      data: {
        isDone: shouldCloseObligationEvent(status),
      },
    });
  }

  revalidateObligationPaths(obligation.clientId, obligation.caseId);
  return { success: true as const };
}

export async function deleteObligation(formData: FormData) {
  const id = getRequiredString(formData, "id");
  if (!id) return;

  const obligation = await db.obligation.findUnique({
    where: { id },
    select: {
      clientId: true,
      caseId: true,
      eventId: true,
      paymentEntryId: true,
    },
  });

  if (!obligation) return;

  await db.obligation.delete({ where: { id } });

  if (obligation.eventId) {
    await db.event.delete({ where: { id: obligation.eventId } });
  }

  if (obligation.paymentEntryId) {
    await db.accountEntry.delete({ where: { id: obligation.paymentEntryId } });
  }

  revalidateObligationPaths(obligation.clientId, obligation.caseId);
}
