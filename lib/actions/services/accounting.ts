import { parseCreateTransactionInput } from "@/lib/actions/parsers";
import { ACTION_OK, actionError, ActionResult } from "@/lib/actions/action-result";
import { RevalidatePath } from "./types";

function parseLocalAccountingDate(value: string) {
  if (!value) return new Date(NaN);
  return new Date(`${value}T12:00:00`);
}

export async function createTransactionWithDeps(
  formData: FormData,
  deps: {
    createTransaction(data: {
      caseId: string;
      description: string;
      amount: number;
      type: string;
    }): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
): Promise<ActionResult> {
  const { caseId, clientId, description, amount, type } = parseCreateTransactionInput(formData);

  if (!caseId || amount === null || amount <= 0 || !type) {
    return actionError("Faltan datos obligatorios del movimiento de caja.");
  }

  await deps.createTransaction({ caseId, description, amount, type });

  deps.revalidatePath(`/client/${clientId}/case/${caseId}`);
  return ACTION_OK;
}

export interface AccountEntryInput {
  date: string;
  description: string;
  concept: string;
  debe: number;
  haber: number;
  caseId?: string;
}

export interface UpdateAccountEntryInput extends AccountEntryInput {
  id: string;
}

export async function createAccountEntryWithDeps(
  data: AccountEntryInput,
  deps: {
    createAccountEntry(data: {
      date: Date;
      description: string;
      concept: string;
      debe: number;
      haber: number;
      caseId: string | null;
    }): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
): Promise<{ success: true; entry: unknown } | { success: false; error: string }> {
  const date = parseLocalAccountingDate(data.date);

  if (!data.description.trim() || Number.isNaN(date.getTime())) {
    return { success: false, error: "Faltan datos obligatorios del movimiento contable." };
  }

  const newEntry = await deps.createAccountEntry({
    date,
    description: data.description,
    concept: data.concept,
    debe: data.debe,
    haber: data.haber,
    caseId: data.caseId || null,
  });

  deps.revalidatePath("/contabilidad");
  if (data.caseId) {
    deps.revalidatePath(`/client/[id]/case/${data.caseId}`);
  }

  return { success: true, entry: newEntry };
}

export async function deleteAccountEntryWithDeps(
  id: string,
  caseId: string | undefined,
  deps: {
    deleteAccountEntry(id: string): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
) {
  await deps.deleteAccountEntry(id);
  deps.revalidatePath("/contabilidad");

  if (caseId) {
    deps.revalidatePath(`/client/[id]/case/${caseId}`);
  }

  return true;
}

export async function updateAccountEntryWithDeps(
  data: UpdateAccountEntryInput,
  deps: {
    updateAccountEntry(id: string, data: {
      date: Date;
      description: string;
      concept: string;
      debe: number;
      haber: number;
      caseId: string | null;
    }): Promise<unknown>;
  }
): Promise<ActionResult> {
  const date = parseLocalAccountingDate(data.date);

  if (!data.id) {
    return actionError("No se pudo identificar el movimiento contable.");
  }

  if (!data.description.trim() || Number.isNaN(date.getTime())) {
    return actionError("Faltan datos obligatorios del movimiento contable.");
  }

  if (data.debe <= 0 && data.haber <= 0) {
    return actionError("Tenes que indicar un ingreso o un egreso mayor a cero.");
  }

  await deps.updateAccountEntry(data.id, {
    date,
    description: data.description,
    concept: data.concept,
    debe: data.debe,
    haber: data.haber,
    caseId: data.caseId || null,
  });

  return ACTION_OK;
}
