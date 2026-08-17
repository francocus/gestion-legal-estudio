import { getRequiredString } from "@/lib/actions/form-data";
import { ACTION_OK, actionError, ActionResult } from "@/lib/actions/action-result";
import { RevalidatePath } from "./types";

export async function createNoteWithDeps(
  caseId: string,
  clientId: string,
  content: string,
  type: string,
  deps: {
    createNote(data: {
      content: string;
      type: string;
      caseId: string;
    }): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
): Promise<ActionResult> {
  const normalizedContent = content.trim();

  if (!caseId || !clientId || !normalizedContent) {
    return actionError("La nota no puede estar vacia.");
  }

  await deps.createNote({
    content: normalizedContent,
    type,
    caseId,
  });

  deps.revalidatePath(`/client/${clientId}/case/${caseId}`);
  return ACTION_OK;
}

export async function deleteNoteWithDeps(
  noteId: string,
  caseId: string,
  clientId: string,
  deps: {
    deleteNote(id: string): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
) {
  if (!noteId) return;

  await deps.deleteNote(noteId);
  deps.revalidatePath(`/client/${clientId}/case/${caseId}`);
}

export async function attachLegalSourceToCaseWithDeps(
  formData: FormData,
  deps: {
    attach(caseId: string, legalSourceId: string): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
): Promise<ActionResult> {
  const caseId = getRequiredString(formData, "caseId");
  const clientId = getRequiredString(formData, "clientId");
  const legalSourceId = getRequiredString(formData, "legalSourceId");

  if (!caseId || !clientId || !legalSourceId) {
    return actionError("No se pudo vincular la fuente juridica al expediente.");
  }

  await deps.attach(caseId, legalSourceId);
  deps.revalidatePath(`/client/${clientId}/case/${caseId}`);
  return ACTION_OK;
}

export async function detachLegalSourceFromCaseWithDeps(
  formData: FormData,
  deps: {
    detach(caseId: string, legalSourceId: string): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
): Promise<ActionResult> {
  const caseId = getRequiredString(formData, "caseId");
  const clientId = getRequiredString(formData, "clientId");
  const legalSourceId = getRequiredString(formData, "legalSourceId");

  if (!caseId || !clientId || !legalSourceId) {
    return actionError("No se pudo desvincular la fuente juridica del expediente.");
  }

  await deps.detach(caseId, legalSourceId);
  deps.revalidatePath(`/client/${clientId}/case/${caseId}`);
  return ACTION_OK;
}
