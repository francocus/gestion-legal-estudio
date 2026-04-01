import { getOptionalString, getRequiredString, getStringWithDefault } from "@/lib/actions/form-data";
import { buildClientPayload, parseCreateAgendaEventInput, parseCreateCaseInput, parseCreateTransactionInput, parseEditCaseInput } from "@/lib/actions/parsers";
import { CaseStatus, EventType, LegalSourceType } from "@prisma/client";
import { ACTION_OK, actionError, ActionResult } from "@/lib/actions/action-result";

type RevalidatePath = (path: string) => void;

function parseLocalAccountingDate(value: string) {
  if (!value) return new Date(NaN);
  return new Date(`${value}T12:00:00`);
}

export async function createAgendaEventWithDeps(
  formData: FormData,
  deps: {
    createEvent(data: {
      title: string;
      date: Date;
      type: EventType;
      description: string;
      caseId: string | null;
    }): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
): Promise<ActionResult> {
  const { title, dateStr, date, type, description, caseId } = parseCreateAgendaEventInput(formData);

  if (!title || !dateStr || !type || Number.isNaN(date.getTime())) {
    return actionError("Faltan datos obligatorios del evento.");
  }

  await deps.createEvent({
    title,
    date,
    type,
    description,
    caseId,
  });

  deps.revalidatePath("/agenda");
  return ACTION_OK;
}

export async function deleteAgendaEventWithDeps(
  formData: FormData,
  deps: {
    deleteEvent(id: string): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
) {
  const id = getRequiredString(formData, "id");
  const clientId = getOptionalString(formData, "clientId");
  const caseId = getOptionalString(formData, "caseId");

  if (!id) return;

  await deps.deleteEvent(id);

  deps.revalidatePath("/agenda");
  deps.revalidatePath("/");

  if (clientId && caseId) {
    deps.revalidatePath(`/client/${clientId}/case/${caseId}`);
  }
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

export async function registerUserWithDeps(
  prevState: { error?: string; success?: string } | undefined,
  formData: FormData,
  deps: {
    findUserByEmail(email: string): Promise<{ id: string } | null>;
    hashPassword(password: string): Promise<string>;
    createUser(data: { name: string; email: string; password: string; role: string }): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
) {
  void prevState;

  const name = getRequiredString(formData, "name");
  const email = getRequiredString(formData, "email");
  const passwordRaw = getRequiredString(formData, "password");
  const role = getStringWithDefault(formData, "role", "USER");

  if (!name || !email || !passwordRaw) {
    return { error: "Faltan datos obligatorios." };
  }

  const existingUser = await deps.findUserByEmail(email);

  if (existingUser) {
    return { error: "Este email ya está registrado." };
  }

  const hashedPassword = await deps.hashPassword(passwordRaw);

  await deps.createUser({
    name,
    email,
    password: hashedPassword,
    role,
  });

  deps.revalidatePath("/team");
  return { success: "Usuario creado correctamente." };
}

export async function deleteUserWithDeps(
  formData: FormData,
  deps: {
    deleteUser(id: string): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
) {
  const id = getRequiredString(formData, "id");
  if (!id) return;

  await deps.deleteUser(id);
  deps.revalidatePath("/team");
}

export async function createMovementWithDeps(
  formData: FormData,
  deps: {
    createMovement(data: {
      caseId: string;
      title: string;
      description: string;
      date: Date;
    }): Promise<unknown>;
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

  await deps.createMovement({ caseId, title, description, date });
  deps.revalidatePath(`/client/${clientId}/case/${caseId}`);
  return ACTION_OK;
}

export async function deleteMovementWithDeps(
  formData: FormData,
  deps: {
    deleteMovement(id: string): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
) {
  const id = getRequiredString(formData, "id");
  const clientId = getRequiredString(formData, "clientId");
  const caseId = getRequiredString(formData, "caseId");

  if (!id) return;

  await deps.deleteMovement(id);
  deps.revalidatePath(`/client/${clientId}/case/${caseId}`);
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

export async function createLegalSourceWithDeps(
  formData: FormData,
  deps: {
    createLegalSource(data: {
      title: string;
      type: LegalSourceType;
      area: string;
      country: string;
      content: string;
      sourceUrl: string | null;
      publicationDate: Date | null;
    }): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
): Promise<ActionResult> {
  const title = getRequiredString(formData, "title");
  const rawType = getRequiredString(formData, "type");
  const area = getRequiredString(formData, "area");
  const content = getRequiredString(formData, "content");
  const sourceUrl = getOptionalString(formData, "sourceUrl");
  const publicationDateRaw = getOptionalString(formData, "publicationDate");
  const country = getStringWithDefault(formData, "country", "Argentina");

  if (!title || !rawType || !area || !content) {
    return actionError("Faltan datos obligatorios de la fuente juridica.");
  }

  if (!["Argentina", "Paraguay"].includes(country)) {
    return actionError("La biblioteca solo admite fuentes de Argentina o Paraguay.");
  }

  const type = rawType as LegalSourceType;
  const publicationDate = publicationDateRaw ? new Date(`${publicationDateRaw}T12:00:00`) : null;

  if (publicationDate && Number.isNaN(publicationDate.getTime())) {
    return actionError("La fecha de publicacion es invalida.");
  }

  await deps.createLegalSource({
    title,
    type,
    area: area.toUpperCase(),
    country,
    content,
    sourceUrl: sourceUrl || null,
    publicationDate,
  });

  deps.revalidatePath("/biblioteca");
  return ACTION_OK;
}

export async function deleteLegalSourceWithDeps(
  id: string,
  deps: {
    deleteLegalSource(id: string): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
) {
  if (!id) return;

  await deps.deleteLegalSource(id);
  deps.revalidatePath("/biblioteca");
}

export async function markLegalSourceReviewedWithDeps(
  id: string,
  deps: {
    markReviewed(id: string): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
) {
  if (!id) return;

  await deps.markReviewed(id);
  deps.revalidatePath("/biblioteca");
}

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
