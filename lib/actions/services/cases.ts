import { getOptionalString, getRequiredString } from "@/lib/actions/form-data";
import { buildClientPayload, parseCreateCaseInput, parseEditCaseInput } from "@/lib/actions/parsers";
import { CaseStatus } from "@prisma/client";
import { ACTION_OK, actionError, ActionResult } from "@/lib/actions/action-result";
import { RevalidatePath } from "./types";

export async function createCaseWithDeps(
  formData: FormData,
  deps: {
    createCase(data: {
      caratula: string;
      code: string | null;
      juzgado: string | null;
      description: string;
      clientId: string;
      area: string;
      isExtrajudicial: boolean;
    }): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
): Promise<ActionResult> {
  const { clientId, caratula, description, area, isExtrajudicial, code, juzgado } = parseCreateCaseInput(formData);

  if (!clientId || !caratula) {
    return actionError("Faltan datos obligatorios del expediente.");
  }

  await deps.createCase({
    caratula,
    code: code || null,
    juzgado: juzgado || null,
    description,
    clientId,
    area,
    isExtrajudicial,
  });

  deps.revalidatePath(`/client/${clientId}`);
  return ACTION_OK;
}

export async function createClientWithDeps(
  formData: FormData,
  deps: {
    createClient(data: ReturnType<typeof buildClientPayload>): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
): Promise<ActionResult> {
  const payload = buildClientPayload(formData);

  if (!payload.firstName || !payload.lastName) {
    return actionError("Nombre y apellido son obligatorios.");
  }

  await deps.createClient(payload);
  deps.revalidatePath("/");
  return ACTION_OK;
}

export async function updateClientWithDeps(
  formData: FormData,
  deps: {
    updateClient(id: string, data: ReturnType<typeof buildClientPayload>): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
): Promise<ActionResult> {
  const id = getRequiredString(formData, "id");
  const payload = buildClientPayload(formData);

  if (!id) {
    return actionError("No se pudo identificar el cliente a actualizar.");
  }

  await deps.updateClient(id, payload);
  deps.revalidatePath(`/client/${id}`);
  deps.revalidatePath("/");
  return ACTION_OK;
}

export async function deleteClientWithDeps(
  formData: FormData,
  deps: {
    deleteClient(id: string): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
) {
  const id = getRequiredString(formData, "id");
  if (!id) return;

  await deps.deleteClient(id);
  deps.revalidatePath("/");
}

export async function createMovementWithDeps(
  formData: FormData,
  deps: {
    createMovement(data: {
      caseId: string;
      title: string;
      description: string;
      date: Date;
    }): Promise<{ id: string }>;
    saveDocument?(
      movementId: string,
      file: File
    ): Promise<void>;
    revalidatePath: RevalidatePath;
  }
): Promise<ActionResult> {
  const caseId = getRequiredString(formData, "caseId");
  const clientId = getRequiredString(formData, "clientId");
  const title = getRequiredString(formData, "title");
  const description = getOptionalString(formData, "description") ?? "";
  const dateStr = getRequiredString(formData, "date");
  const date = new Date(dateStr);

  if (!caseId || !title || !dateStr || Number.isNaN(date.getTime())) {
    return actionError("Faltan datos obligatorios del movimiento.");
  }

  const movement = await deps.createMovement({ caseId, title, description, date });

  const documents = formData
    .getAll("documents")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (deps.saveDocument && documents.length > 0) {
    for (const document of documents) {
      await deps.saveDocument(movement.id, document);
    }
  }

  deps.revalidatePath(`/client/${clientId}/case/${caseId}`);
  return ACTION_OK;
}

export async function deleteMovementWithDeps(
  formData: FormData,
  deps: {
    listDocuments?(movementId: string): Promise<Array<{ filePath: string }>>;
    removeStoredFile?(filePath: string): Promise<void>;
    deleteMovement(id: string): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
) {
  const id = getRequiredString(formData, "id");
  const clientId = getRequiredString(formData, "clientId");
  const caseId = getRequiredString(formData, "caseId");

  if (!id) return;

  if (deps.listDocuments && deps.removeStoredFile) {
    const documents = await deps.listDocuments(id);
    for (const document of documents) {
      await deps.removeStoredFile(document.filePath);
    }
  }

  await deps.deleteMovement(id);
  deps.revalidatePath(`/client/${clientId}/case/${caseId}`);
}

export async function editCaseWithDeps(
  formData: FormData,
  deps: {
    updateCase(
      id: string,
      data: {
        caratula: string;
        juzgado: string;
        status: CaseStatus;
        code: string;
        totalFee: number;
        driveLink: string | null;
        area: string;
        description: string;
      }
    ): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
): Promise<ActionResult> {
  const { id, caratula, juzgado, code, status, totalFee, driveLink, area, description } = parseEditCaseInput(formData);

  if (!id) {
    return actionError("No se pudo identificar el expediente a actualizar.");
  }

  await deps.updateCase(id, {
    caratula,
    juzgado,
    status,
    code,
    totalFee,
    driveLink,
    area,
    description,
  });

  deps.revalidatePath("/");
  return ACTION_OK;
}
