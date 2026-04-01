"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { AccountEntryInput, createAccountEntryWithDeps, deleteAccountEntryWithDeps } from "@/lib/actions/services";

export async function createAccountEntry(data: AccountEntryInput) {
  return createAccountEntryWithDeps(data, {
    createAccountEntry(entryData) {
      return db.accountEntry.create({
        data: entryData,
      });
    },
    revalidatePath,
  });
}

export async function deleteAccountEntry(id: string, caseId?: string) {
  try {
    await deleteAccountEntryWithDeps(id, caseId, {
      deleteAccountEntry(entryId) {
        return db.accountEntry.delete({
          where: { id: entryId },
        });
      },
      revalidatePath,
    });

    return true;
  } catch (error) {
    console.error("Error eliminando entrada contable:", error);
    throw new Error("Fallo al eliminar el movimiento contable");
  }
}
