"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  AccountEntryInput,
  createAccountEntryWithDeps,
  deleteAccountEntryWithDeps,
  updateAccountEntryWithDeps,
  UpdateAccountEntryInput,
} from "@/lib/actions/services";
import { ACTION_OK } from "@/lib/actions/action-result";

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

export async function updateAccountEntry(data: UpdateAccountEntryInput) {
  const existingEntry = await db.accountEntry.findUnique({
    where: { id: data.id },
    select: { caseId: true },
  });

  const result = await updateAccountEntryWithDeps(data, {
    updateAccountEntry(id, entryData) {
      return db.accountEntry.update({
        where: { id },
        data: entryData,
      });
    },
  });

  if (!result.success) {
    return result;
  }

  revalidatePath("/contabilidad");

  if (existingEntry?.caseId) {
    const previousCase = await db.case.findUnique({
      where: { id: existingEntry.caseId },
      select: { id: true, clientId: true },
    });

    if (previousCase) {
      revalidatePath(`/client/${previousCase.clientId}/case/${previousCase.id}`);
    }
  }

  if (data.caseId) {
    const currentCase = await db.case.findUnique({
      where: { id: data.caseId },
      select: { id: true, clientId: true },
    });

    if (currentCase) {
      revalidatePath(`/client/${currentCase.clientId}/case/${currentCase.id}`);
      revalidatePath(`/client/${currentCase.clientId}`);
    }
  }

  return ACTION_OK;
}
