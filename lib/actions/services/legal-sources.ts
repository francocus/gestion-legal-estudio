import { getOptionalString, getRequiredString, getStringWithDefault } from "@/lib/actions/form-data";
import { LegalSourceType } from "@prisma/client";
import { ACTION_OK, actionError, ActionResult } from "@/lib/actions/action-result";
import { buildOfficialLegalSnapshot, inferArgentinaLawNumber, inferPublicationDateFromText } from "@/lib/legal-source-fetch";
import { detectOfficialLegalSource } from "@/lib/legal-source-officials";
import { RevalidatePath } from "./types";

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
