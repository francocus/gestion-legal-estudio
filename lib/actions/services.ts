import { getOptionalString, getRequiredString, getStringWithDefault } from "@/lib/actions/form-data";
import { buildClientPayload, parseCreateAgendaEventInput, parseCreateCaseInput, parseCreateTransactionInput, parseEditCaseInput } from "@/lib/actions/parsers";
import { CaseStatus, EventType, LegalSourceType } from "@prisma/client";
import { ACTION_OK, actionError, ActionResult } from "@/lib/actions/action-result";
import { buildOfficialLegalSnapshot, inferArgentinaLawNumber, inferPublicationDateFromText } from "@/lib/legal-source-fetch";
import { detectOfficialLegalSource } from "@/lib/legal-source-officials";

type RevalidatePath = (path: string) => void;
const OFFICIAL_SOURCE_PLACEHOLDER = "Fuente oficial en verificacion.";

function normalizeTrackedLegalText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function toSentenceCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b([a-záéíóúñü])/g, (match) => match.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}

function toLegalTitleCase(value: string) {
  const lowerWords = new Set(["a", "al", "ante", "bajo", "con", "contra", "de", "del", "desde", "durante", "e", "el", "en", "entre", "hacia", "hasta", "la", "las", "lo", "los", "o", "para", "pero", "por", "segun", "sin", "sobre", "tras", "u", "un", "una", "y"]);
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word, index) => {
      if (!word) return word;
      if (index > 0 && lowerWords.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function buildCanonicalManualLawTitle(title: string, officialNumber?: string | null) {
  const normalizedTitle = toLegalTitleCase(title)
    .replace(/^Ley\s+\d+[\s:.-]*/i, "")
    .replace(/^Ley\s+\d+\s*-\s*/i, "")
    .trim();

  if (!officialNumber) {
    return normalizedTitle || title.trim();
  }

  if (!normalizedTitle) {
    return `Ley ${officialNumber}`;
  }

  return `Ley ${officialNumber} - ${normalizedTitle}`;
}

function buildCanonicalManualSourceTitle(
  title: string,
  type: LegalSourceType,
  officialNumber?: string | null
) {
  if (type === "LAW") {
    return buildCanonicalManualLawTitle(title, officialNumber);
  }

  const normalizedTitle = toLegalTitleCase(title)
    .replace(/\s+/g, " ")
    .trim();

  return normalizedTitle || title.trim();
}

function buildFallbackManualSummary(input: {
  title: string;
  type: LegalSourceType;
  country: string;
  area: string;
  officialNumber?: string | null;
}) {
  const title = toLegalTitleCase(input.title).replace(/^Ley\s+\S+\s*-\s*/i, "").trim();
  const country = input.country;

  switch (input.type) {
    case "CODE":
      return `El ${title} de ${country} establece el marco normativo principal de la materia ${input.area.toLowerCase()} y organiza las reglas aplicables dentro de ese ambito.`;
    case "CONSTITUTION":
      return `La ${title} de ${country} reune las bases institucionales, derechos y principios rectores del orden juridico nacional.`;
    case "LAW":
      return `La Ley ${input.officialNumber ?? ""}${input.officialNumber ? " " : ""}${title ? `regula ${title.toLowerCase()} en ${country}` : `de ${country}`} y fija su objeto, alcance y reglas principales de aplicacion.`.replace(/\s+/g, " ").trim();
    case "JURISPRUDENCE":
      return `El fallo ${title} de ${country} aporta criterio jurisprudencial relevante para la materia ${input.area.toLowerCase()} y su aplicacion practica.`;
    default:
      return `La fuente ${title} de ${country} desarrolla reglas y criterios relevantes para la materia ${input.area.toLowerCase()}.`;
  }
}

function normalizeManualSummary(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) return value;
  if (compact === compact.toUpperCase()) {
    return toSentenceCase(compact);
  }
  return compact;
}

function isUsefulManualSummary(sourceContent: string, summary: string) {
  const normalizedSource = normalizeTrackedLegalText(sourceContent);
  const normalizedSummary = normalizeTrackedLegalText(summary);

  if (!normalizedSummary) return false;
  if (normalizedSummary === normalizedSource) return false;
  if (normalizedSource.includes(normalizedSummary) && normalizedSummary.length > normalizedSource.length * 0.7) {
    return false;
  }

  return true;
}

function inferManualPublicationDate(...values: Array<string | null | undefined>) {
  const combined = values.filter(Boolean).join(" ");
  if (!combined.trim()) {
    return null;
  }

  const monthMap: Record<string, number> = {
    ene: 0,
    feb: 1,
    mar: 2,
    abr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    ago: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dic: 11,
  };

  const alphaMatch = combined.match(/(?:publicad[ao]|sancionad[ao]|promulgad[ao])[\s\S]{0,80}?(?:el\s+)?(\d{1,2})[-/ ]([a-zA-ZáéíóúÁÉÍÓÚ]{3,})[-/ ](\d{2,4})/i);
  if (alphaMatch) {
    const month = monthMap[alphaMatch[2].toLowerCase().slice(0, 3)];
    if (month !== undefined) {
      const year = alphaMatch[3].length === 2 ? Number(`20${alphaMatch[3]}`) : Number(alphaMatch[3]);
      return new Date(year, month, Number(alphaMatch[1]), 12, 0, 0);
    }
  }

  const numericMatch = combined.match(/(?:publicad[ao]|sancionad[ao]|promulgad[ao])[\s\S]{0,80}?(?:el\s+)?(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/i);
  if (numericMatch) {
    const year = numericMatch[3].length === 2 ? Number(`20${numericMatch[3]}`) : Number(numericMatch[3]);
    return new Date(year, Number(numericMatch[2]) - 1, Number(numericMatch[1]), 12, 0, 0);
  }

  return inferPublicationDateFromText(combined);
}

function parseSuggestedPublicationDate(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) return null;

  return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), 12, 0, 0);
}

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
      officialText: string | null;
      sourceUrl: string | null;
      publicationDate: Date | null;
      officialNumber: string | null;
      officialName: string | null;
      validityStatus: string | null;
      relatedRule: string | null;
      previousText: string | null;
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
  const officialNumber = getOptionalString(formData, "officialNumber");
  const officialName = getOptionalString(formData, "officialName");
  const validityStatus = getOptionalString(formData, "validityStatus");
  const relatedRule = getOptionalString(formData, "relatedRule");
  const previousText = getOptionalString(formData, "previousText");
  const officialSource = detectOfficialLegalSource(sourceUrl, country);

  if (!rawType || !area || (!title && !officialSource.preferred) || (!content && !officialSource.preferred)) {
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

  const normalizedTitle = title || (officialNumber ? `Ley ${officialNumber}` : "Fuente juridica oficial");
  const normalizedContent = content || OFFICIAL_SOURCE_PLACEHOLDER;

  const created = await deps.createLegalSource({
    title: normalizedTitle,
    type,
    area: area.toUpperCase(),
    country,
    content: normalizedContent,
    officialText: null,
    sourceUrl: sourceUrl || null,
    publicationDate,
    officialNumber: officialNumber || null,
    officialName: officialName || null,
    validityStatus: validityStatus || null,
    relatedRule: relatedRule || null,
    previousText: previousText || null,
  });

  deps.revalidatePath("/biblioteca");
  if (created && typeof created === "object" && "id" in created && typeof created.id === "string") {
    return { success: true, id: created.id };
  }
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

export async function verifyOfficialLegalSourceUpdateWithDeps(
  id: string,
  deps: {
    findLegalSource(id: string): Promise<{
      id: string;
      title: string;
      type: LegalSourceType;
      area: string;
      country: string;
      content: string;
      officialText: string | null;
      sourceUrl: string | null;
      publicationDate: Date | null;
      officialNumber: string | null;
      officialName: string | null;
      validityStatus: string | null;
      relatedRule: string | null;
      previousText: string | null;
    } | null>;
    fetchOfficialText(sourceUrl: string): Promise<string | null>;
    analyzeOfficialVerification?(input: {
      title: string;
      content: string;
      country: string;
      area: string;
      type: string;
      sourceUrl: string;
      officialContent: string;
    }): Promise<{ success: true; status: "OK" | "REVISAR" } | { success: false; error: string }>;
    summarizeOfficialText?(input: {
      title: string;
      country: string;
      area: string;
      type: string;
      officialContent: string;
    }): Promise<{
      success: true;
      summary: string;
      suggestedTitle?: string | null;
      suggestedType?: string | null;
      suggestedArea?: string | null;
    } | { success: false; error: string }>;
    updateLegalSource(
      id: string,
      data: {
        title?: string;
        type?: LegalSourceType;
        area?: string;
        content?: string;
        officialText?: string | null;
        previousText?: string | null;
        publicationDate?: Date | null;
        officialNumber?: string | null;
        officialName?: string | null;
        validityStatus?: string | null;
      relatedRule?: string | null;
      lastAiCheck: Date;
      isOutdated: boolean;
      }
    ): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
): Promise<ActionResult> {
  if (!id) {
    return actionError("No se pudo identificar la fuente juridica.");
  }

  const source = await deps.findLegalSource(id);
  if (!source) {
    return actionError("La fuente juridica no existe.");
  }

  if (!source.sourceUrl) {
    return actionError("La fuente no tiene link oficial para verificar.");
  }

  const officialSource = detectOfficialLegalSource(source.sourceUrl, source.country);
  if (!officialSource.recognized) {
    return actionError("El link cargado no corresponde a una fuente oficial reconocida.");
  }

  const officialText = await deps.fetchOfficialText(source.sourceUrl);
  if (!officialText) {
    return actionError("No se pudo leer el texto oficial en este momento.");
  }

  const snapshot = buildOfficialLegalSnapshot(source.sourceUrl, officialText, source.country);
  const officialContent = snapshot.normalizedContent.trim();

  if (!officialContent) {
    return actionError("No se pudo generar una version util del texto oficial.");
  }

  const previousOfficialText = source.officialText?.trim() ?? "";
  let shouldFlagUpdate =
    Boolean(previousOfficialText) &&
    normalizeTrackedLegalText(previousOfficialText) !== normalizeTrackedLegalText(officialContent);

  let displayContent = snapshot.normalizedContent;
  let suggestedTitle: string | null = snapshot.normalizedTitle ?? null;
  let suggestedType: LegalSourceType | undefined;
  let suggestedArea: string | undefined;

  if (deps.analyzeOfficialVerification) {
    const analysis = await deps.analyzeOfficialVerification({
      title: source.title,
      content: source.content,
      country: source.country,
      area: source.area,
      type: source.type,
      sourceUrl: source.sourceUrl,
      officialContent,
    });

    if (analysis.success && analysis.status === "REVISAR") {
      shouldFlagUpdate = true;
    }
  }

  if (deps.summarizeOfficialText) {
    const summaryResult = await deps.summarizeOfficialText({
      title: snapshot.normalizedTitle ?? source.title,
      country: source.country,
      area: source.area,
      type: source.type,
      officialContent,
    });

    if (summaryResult.success) {
      displayContent = summaryResult.summary.trim() || displayContent;
      if (!suggestedTitle) {
        suggestedTitle = summaryResult.suggestedTitle?.trim() || suggestedTitle;
      }
      if (summaryResult.suggestedType && ["LAW", "CODE", "CONSTITUTION", "JURISPRUDENCE", "OTHER"].includes(summaryResult.suggestedType)) {
        suggestedType = summaryResult.suggestedType as LegalSourceType;
      }
      if (summaryResult.suggestedArea && ["CIVIL", "PENAL", "LABORAL", "COMERCIAL", "CONSTITUCIONAL", "ADMINISTRATIVO", "TRIBUTARIO", "FAMILIA"].includes(summaryResult.suggestedArea)) {
        suggestedArea = summaryResult.suggestedArea;
      }
    }
  }

  await deps.updateLegalSource(source.id, {
    title: suggestedTitle ?? source.title,
    type: suggestedType,
    area: suggestedArea,
    content: displayContent,
    officialText: officialContent,
    previousText: shouldFlagUpdate ? source.officialText ?? source.previousText ?? null : source.previousText ?? null,
    publicationDate: snapshot.publicationDate ?? source.publicationDate ?? null,
    officialNumber: snapshot.officialNumber ?? source.officialNumber ?? null,
    officialName: snapshot.officialName ?? source.officialName ?? null,
    validityStatus: snapshot.validityStatus ?? source.validityStatus ?? null,
    relatedRule: snapshot.relatedRule ?? source.relatedRule ?? null,
    lastAiCheck: new Date(),
    isOutdated: shouldFlagUpdate,
  });

  deps.revalidatePath("/biblioteca");
  return shouldFlagUpdate
    ? { success: true, message: "Se detecto una actualizacion oficial y la ley fue sincronizada." }
    : { success: true, message: "No se detectaron cambios en la fuente oficial." };
}

export async function validateManualLegalSourceWithDeps(
  id: string,
  deps: {
    findLegalSource(id: string): Promise<{
      id: string;
      title: string;
      type: LegalSourceType;
      area: string;
      country: string;
      content: string;
      sourceUrl: string | null;
      officialNumber: string | null;
      publicationDate: Date | null;
    } | null>;
    analyzeSnapshot(input: {
      title: string;
      content: string;
      country: string;
      area: string;
      type: string;
    }): Promise<{ success: true; status: "OK" | "REVISAR" } | { success: false; error: string }>;
    summarizeManual?(input: {
      title: string;
      content: string;
      country: string;
      area: string;
      type: string;
      officialNumber?: string | null;
    }): Promise<{
      success: true;
      summary: string;
      suggestedTitle?: string | null;
      suggestedType?: string | null;
      suggestedArea?: string | null;
      suggestedPublicationDate?: string | null;
    } | { success: false; error: string }>;
    updateLegalSource(
      id: string,
      data: {
        title?: string;
        type?: LegalSourceType;
        area?: string;
        content?: string;
        officialNumber?: string | null;
        publicationDate?: Date | null;
        lastAiCheck: Date;
        isOutdated: boolean;
      }
    ): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
): Promise<ActionResult> {
  if (!id) {
    return actionError("No se pudo identificar la fuente juridica.");
  }

  const source = await deps.findLegalSource(id);
  if (!source) {
    return actionError("La fuente juridica no existe.");
  }

  const analysis = await deps.analyzeSnapshot({
    title: source.title,
    content: source.content,
    country: source.country,
    area: source.area,
    type: source.type,
  });

  let nextTitle = source.title;
  let nextContent = source.content;
  let nextType = source.type;
  let nextArea = source.area;
  let nextOfficialNumber = source.officialNumber;
  let nextPublicationDate = source.publicationDate;
  let didImproveCard = false;
  let didImproveSummary = false;

  if (deps.summarizeManual) {
    const summary = await deps.summarizeManual({
      title: source.title,
      content: source.content,
      country: source.country,
      area: source.area,
      type: source.type,
      officialNumber: source.officialNumber,
    });

    if (summary.success) {
      const suggestedTitle = summary.suggestedTitle?.trim();
      const suggestedContent = summary.summary.trim();

      if (suggestedTitle) {
        const canonicalSuggestedTitle = buildCanonicalManualSourceTitle(
          suggestedTitle,
          source.type,
          source.officialNumber
        );
        if (canonicalSuggestedTitle !== source.title) {
          nextTitle = canonicalSuggestedTitle;
          didImproveCard = true;
        }
      }

      if (suggestedContent) {
        const normalizedSummary = normalizeManualSummary(suggestedContent);
        if (normalizedSummary !== source.content && isUsefulManualSummary(source.content, normalizedSummary)) {
          nextContent = normalizedSummary;
          didImproveCard = true;
          didImproveSummary = true;
        }
      }

      if (summary.suggestedType && ["LAW", "CODE", "CONSTITUTION", "JURISPRUDENCE", "OTHER"].includes(summary.suggestedType)) {
        nextType = source.type;
      }
      if (summary.suggestedArea && ["CIVIL", "PENAL", "LABORAL", "COMERCIAL", "CONSTITUCIONAL", "ADMINISTRATIVO", "TRIBUTARIO", "FAMILIA"].includes(summary.suggestedArea)) {
        nextArea = source.area;
      }

      if (!nextPublicationDate) {
        const aiPublicationDate = parseSuggestedPublicationDate(summary.suggestedPublicationDate);
        if (aiPublicationDate) {
          nextPublicationDate = aiPublicationDate;
          didImproveCard = true;
        }
      }
    }
  }

  const shouldUseFallbackSummary =
    source.content.trim().length <= 120 ||
    normalizeTrackedLegalText(source.content) === normalizeTrackedLegalText(source.title);

  if (!didImproveSummary && shouldUseFallbackSummary) {
    const fallbackSummary = buildFallbackManualSummary({
      title: nextTitle,
      type: source.type,
      country: source.country,
      area: source.area,
      officialNumber: source.officialNumber,
    });

    if (fallbackSummary && fallbackSummary !== source.content) {
      nextContent = fallbackSummary;
      didImproveCard = true;
      didImproveSummary = true;
    }
  }

  if (!didImproveCard && source.officialNumber) {
    const fallbackTitle = buildCanonicalManualSourceTitle(source.title, source.type, source.officialNumber);
    if (fallbackTitle !== source.title) {
      nextTitle = fallbackTitle;
      didImproveCard = true;
    }
  }

  if (!nextOfficialNumber) {
    const inferredNumber = inferArgentinaLawNumber(source.title, source.content);
    if (inferredNumber) {
      nextOfficialNumber = inferredNumber;
      didImproveCard = true;
    }
  }

  if (!nextPublicationDate) {
    const inferredDate = inferManualPublicationDate(source.content, source.title);
    if (inferredDate) {
      nextPublicationDate = inferredDate;
      didImproveCard = true;
    }
  }

  if (didImproveCard && didImproveSummary) {
    await deps.updateLegalSource(source.id, {
      title: nextTitle,
      type: nextType,
      area: nextArea,
      content: nextContent,
      officialNumber: nextOfficialNumber,
      publicationDate: nextPublicationDate,
      lastAiCheck: new Date(),
      isOutdated: analysis.success ? analysis.status === "REVISAR" : false,
    });

    deps.revalidatePath("/biblioteca");
    return { success: true, message: "La IA valido la fuente y completo la ficha manual." };
  }

  return { success: false, error: "La IA no pudo completar la ficha manual con informacion util." };
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
