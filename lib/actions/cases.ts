"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getRequiredString } from "@/lib/actions/form-data";
import { createCaseWithDeps, editCaseWithDeps } from "@/lib/actions/services";

export async function createCase(formData: FormData) {
  return createCaseWithDeps(formData, {
    createCase(data) {
      return db.case.create({ data });
    },
    revalidatePath,
  });
}

export async function editCase(formData: FormData) {
  return editCaseWithDeps(formData, {
    updateCase(id, data) {
      return db.case.update({
        where: { id },
        data,
      });
    },
    revalidatePath,
  });
}

export async function updateCaseFee(caseId: string, clientId: string, totalFee: number) {
  if (!caseId || !clientId) {
    return { success: false as const, error: "No se pudo identificar el expediente." };
  }

  await db.case.update({
    where: { id: caseId },
    data: { totalFee },
  });

  revalidatePath("/contabilidad");
  revalidatePath(`/client/${clientId}`);
  revalidatePath(`/client/${clientId}/case/${caseId}`);

  return { success: true as const };
}

export async function deleteCase(formData: FormData) {
  const id = getRequiredString(formData, "id");
  const clientId = getRequiredString(formData, "clientId");

  if (!id) return;

  await db.case.delete({ where: { id } });
  revalidatePath(`/client/${clientId}`);
}
