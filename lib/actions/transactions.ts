"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getRequiredString } from "@/lib/actions/form-data";
import { createTransactionWithDeps } from "@/lib/actions/services";

export async function createTransaction(formData: FormData) {
  return createTransactionWithDeps(formData, {
    createTransaction(data) {
      return db.transaction.create({ data });
    },
    revalidatePath,
  });
}

export async function deleteTransaction(formData: FormData) {
  const id = getRequiredString(formData, "id");
  const clientId = getRequiredString(formData, "clientId");
  const caseId = getRequiredString(formData, "caseId");

  if (!id) return;

  await db.transaction.delete({ where: { id } });
  revalidatePath(`/client/${clientId}/case/${caseId}`);
}
