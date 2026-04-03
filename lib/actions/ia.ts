"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  buildLegalAnalysisPrompt,
  parseLegalAnalysisResponse,
  type LegalAnalysisResult,
} from "@/lib/ia/legal-analysis";

interface GenerateContentResponse {
  response: {
    text(): string;
  };
}

interface LegalSourceSnapshotInput {
  title: string;
  content: string;
  country: string;
  area: string;
  type: string;
}

interface OfficialLegalSourceVerificationInput extends LegalSourceSnapshotInput {
  originalContent: string;
  officialContent: string;
  sourceUrl: string;
}

export interface CaseAnalysisInput {
  country: string;
  caratula: string;
  area: string;
  description: string;
  notes: string[];
  legalSources: Array<{
    title: string;
    type: string;
    area: string;
    country: string;
  }>;
}

export interface CaseAnalysis {
  resumen_caso: string;
  puntos_juridicos: string[];
  riesgos: string[];
  proximos_pasos: string[];
}

export type CaseAnalysisResult =
  | { success: true; analysis: CaseAnalysis }
  | { success: false; error: string };

export interface OrganizedNotesAnalysis {
  hechos_relevantes: string[];
  objetivo_del_caso: string;
  pendientes: string[];
  prueba_a_reunir: string[];
  lineas_de_argumento: string[];
}

export type OrganizedNotesResult =
  | { success: true; analysis: OrganizedNotesAnalysis }
  | { success: false; error: string };

export type OfficialLegalSourceSummaryResult =
  | {
      success: true;
      summary: string;
      suggestedTitle?: string | null;
      suggestedType?: string | null;
      suggestedArea?: string | null;
    }
  | { success: false; error: string };

export type ManualLegalSourceSummaryResult =
  | {
      success: true;
      summary: string;
      suggestedTitle?: string | null;
      suggestedType?: string | null;
      suggestedArea?: string | null;
      suggestedPublicationDate?: string | null;
    }
  | { success: false; error: string };

export async function analyzeLegalModificationWithDeps(
  oldText: string,
  newText: string,
  country: string,
  deps: {
    generateContent(prompt: string): Promise<GenerateContentResponse>;
  }
): Promise<LegalAnalysisResult> {
  if (!oldText.trim() || !newText.trim()) {
    return { success: false, error: "Tenes que pegar ambos textos para analizar la modificatoria." };
  }

  try {
    const result = await deps.generateContent(buildLegalAnalysisPrompt(oldText, newText, country));
    return parseLegalAnalysisResponse(result.response.text());
  } catch {
    return { success: false, error: "No se pudo completar el analisis con IA." };
  }
}

function buildLegalSourceSnapshotPrompt(input: LegalSourceSnapshotInput) {
  return `
Sos un asistente juridico. Analiza esta fuente legal de ${input.country} y verifica si el texto parece coherente con su tipo y materia.

Titulo: ${input.title}
Tipo: ${input.type}
Materia: ${input.area}
Pais: ${input.country}

Texto:
${input.content}

Si el texto es consistente, responde solamente: OK
Si el texto parece incompleto o inconsistente, responde solamente: REVISAR
`.trim();
}

function buildOfficialLegalSourceVerificationPrompt(input: OfficialLegalSourceVerificationInput) {
  return `
Sos un asistente juridico. Verifica si la fuente oficial coincide con la fuente cargada y si hay indicios de que la norma no esta vigente o requiere control.

Titulo cargado: ${input.title}
Tipo: ${input.type}
Materia: ${input.area}
Pais: ${input.country}
Link oficial: ${input.sourceUrl}

Texto cargado por el usuario:
${input.originalContent}

Texto obtenido del link oficial:
${input.officialContent}

Responde solamente: OK o REVISAR

Responde REVISAR si ocurre cualquiera de estas situaciones:
- el texto oficial indica derogacion, abrogacion, sustitucion, texto ordenado o remision a otra norma vigente
- hay discrepancias relevantes entre el texto cargado y el texto oficial
- no podes afirmar con seguridad que el contenido cargado corresponde al texto vigente
`.trim();
}

function buildOfficialLegalSourceSummaryPrompt(input: {
  title: string;
  country: string;
  area: string;
  type: string;
  officialContent: string;
}) {
  return `
Sos un asistente juridico. Tenes que resumir una norma oficial vigente para cargarla en una biblioteca de estudio.

Titulo actual: ${input.title}
Pais: ${input.country}
Materia: ${input.area}
Tipo: ${input.type}

Texto oficial:
${input.officialContent}

Responde SOLO en JSON con esta estructura exacta:
{
  "titulo_sugerido": "Maximo 80 caracteres. Si el titulo actual ya sirve, repetilo.",
  "sintesis": "Maximo 120 palabras. Explica de forma clara el objeto principal, alcance y punto central de la norma.",
  "tipo_sugerido": "Uno de estos valores exactos: LAW, CODE, CONSTITUTION, JURISPRUDENCE, OTHER",
  "materia_sugerida": "Uno de estos valores exactos: CIVIL, PENAL, LABORAL, COMERCIAL, CONSTITUCIONAL, ADMINISTRATIVO, TRIBUTARIO, FAMILIA"
}

No copies el texto completo. No hagas comentarios politicos. No cites articulos salvo que sea imprescindible.
`.trim();
}

function buildManualLegalSourceSummaryPrompt(input: {
  title: string;
  country: string;
  area: string;
  type: string;
  content: string;
  officialNumber?: string | null;
}) {
  return `
Sos un asistente juridico. Tenes que revisar una fuente cargada manualmente y dejarla lista para una biblioteca de estudio, con el mismo criterio de sintesis clara que se usa para fuentes oficiales.

Titulo actual: ${input.title}
Pais: ${input.country}
Materia: ${input.area}
Tipo: ${input.type}
Numero oficial: ${input.officialNumber || "Sin dato"}

Texto cargado:
${input.content}

Responde SOLO en JSON con esta estructura exacta:
{
  "titulo_sugerido": "Maximo 100 caracteres. Si es una ley y hay numero oficial, usa formato 'Ley <numero> - <nombre oficial breve>'. El nombre debe sonar oficial o canonico, no generico. No repitas dos veces 'Ley <numero>' ni devuelvas todo en mayusculas.",
  "sintesis": "Maximo 90 palabras. Explica con lenguaje juridico claro el objeto principal, alcance y punto central de la fuente. Debe ser una sintesis real, no una copia literal del texto.",
  "tipo_sugerido": "Uno de estos valores exactos: LAW, CODE, CONSTITUTION, JURISPRUDENCE, OTHER",
  "materia_sugerida": "Uno de estos valores exactos: CIVIL, PENAL, LABORAL, COMERCIAL, CONSTITUCIONAL, ADMINISTRATIVO, TRIBUTARIO, FAMILIA",
  "fecha_publicacion_sugerida": "Formato DD/MM/AAAA si se puede inferir con bastante seguridad; si no, cadena vacia"
}

No copies el texto literal completo. No devuelvas parrafos en mayusculas ni el mismo texto pegado por el usuario.
Si el usuario pego un articulo o un fragmento textual, transformalo en una sintesis profesional breve.
No devuelvas el titulo solo en mayusculas salvo que sea imprescindible.
Si se trata de una ley conocida, intenta reconstruir un nombre oficial breve y usable en estudio.
Si el texto menciona expresamente 'regimen penal', 'codigo penal', 'delito' o 'imputadas', la materia sugerida normalmente deberia ser PENAL.
Si el texto menciona fecha de sancion, promulgacion o publicacion, intenta devolverla en fecha_publicacion_sugerida con formato DD/MM/AAAA.
`.trim();
}

export async function analyzeLegalSourceSnapshotWithDeps(
  input: LegalSourceSnapshotInput,
  deps: {
    generateContent(prompt: string): Promise<GenerateContentResponse>;
  }
): Promise<{ success: true; status: "OK" | "REVISAR" } | { success: false; error: string }> {
  if (!input.title.trim() || !input.content.trim() || !input.country.trim()) {
    return { success: false, error: "Faltan datos para el analisis inicial con IA." };
  }

  try {
    const result = await deps.generateContent(buildLegalSourceSnapshotPrompt(input));
    const normalized = result.response.text().toUpperCase();
    return { success: true, status: normalized.includes("REVISAR") ? "REVISAR" : "OK" };
  } catch {
    return { success: false, error: "No se pudo completar el analisis inicial con IA." };
  }
}

export async function analyzeOfficialLegalSourceVerificationWithDeps(
  input: OfficialLegalSourceVerificationInput,
  deps: {
    generateContent(prompt: string): Promise<GenerateContentResponse>;
  }
): Promise<{ success: true; status: "OK" | "REVISAR" } | { success: false; error: string }> {
  if (!input.title.trim() || !input.originalContent.trim() || !input.officialContent.trim() || !input.country.trim()) {
    return { success: false, error: "Faltan datos para verificar la vigencia contra la fuente oficial." };
  }

  try {
    const result = await deps.generateContent(buildOfficialLegalSourceVerificationPrompt(input));
    const normalized = result.response.text().toUpperCase();
    return { success: true, status: normalized.includes("REVISAR") ? "REVISAR" : "OK" };
  } catch {
    return { success: false, error: "No se pudo verificar la fuente oficial con IA." };
  }
}

export async function summarizeOfficialLegalSourceWithDeps(
  input: {
    title: string;
    country: string;
    area: string;
    type: string;
    officialContent: string;
  },
  deps: {
    generateContent(prompt: string): Promise<GenerateContentResponse>;
  }
): Promise<OfficialLegalSourceSummaryResult> {
  if (!input.officialContent.trim()) {
    return { success: false, error: "Falta texto oficial para resumir la norma." };
  }

  try {
    const result = await deps.generateContent(buildOfficialLegalSourceSummaryPrompt(input));
    const parsed = parseJsonResult<{
      titulo_sugerido: string;
      sintesis: string;
      tipo_sugerido: string;
      materia_sugerida: string;
    }>(result.response.text(), [
      "titulo_sugerido",
      "sintesis",
      "tipo_sugerido",
      "materia_sugerida",
    ]);

    if (!parsed) {
      return { success: false, error: "La IA devolvio una sintesis invalida." };
    }

    return {
      success: true,
      summary: parsed.sintesis,
      suggestedTitle: parsed.titulo_sugerido,
      suggestedType: parsed.tipo_sugerido,
      suggestedArea: parsed.materia_sugerida,
    };
  } catch {
    return { success: false, error: "No se pudo resumir la norma con IA." };
  }
}

export async function summarizeManualLegalSourceWithDeps(
  input: {
    title: string;
    country: string;
    area: string;
    type: string;
    content: string;
    officialNumber?: string | null;
  },
  deps: {
    generateContent(prompt: string): Promise<GenerateContentResponse>;
  }
): Promise<ManualLegalSourceSummaryResult> {
  if (!input.content.trim()) {
    return { success: false, error: "Falta contenido para resumir la fuente." };
  }

  try {
    const result = await deps.generateContent(buildManualLegalSourceSummaryPrompt(input));
    const parsed = parseJsonResult<{
      titulo_sugerido: string;
      sintesis: string;
      tipo_sugerido: string;
      materia_sugerida: string;
      fecha_publicacion_sugerida?: string;
    }>(result.response.text(), [
      "titulo_sugerido",
      "sintesis",
      "tipo_sugerido",
      "materia_sugerida",
    ]);

    if (!parsed) {
      return { success: false, error: "La IA devolvio una sintesis invalida." };
    }

    return {
      success: true,
      summary: parsed.sintesis,
      suggestedTitle: parsed.titulo_sugerido,
      suggestedType: parsed.tipo_sugerido,
      suggestedArea: parsed.materia_sugerida,
      suggestedPublicationDate: parsed.fecha_publicacion_sugerida ?? null,
    };
  } catch {
    return { success: false, error: "No se pudo resumir la fuente con IA." };
  }
}

function parseJsonResult<T extends object>(rawText: string, requiredKeys: Array<keyof T>) {
  try {
    const cleanJson = rawText.replace(/```json\n?|```/g, "").trim();
    const parsed = JSON.parse(cleanJson) as Partial<T>;
    const hasAllKeys = requiredKeys.every((key) => parsed[key] !== undefined);
    if (!hasAllKeys) {
      return null;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

function buildCaseAnalysisPrompt(input: CaseAnalysisInput) {
  const notesBlock = input.notes.length > 0 ? input.notes.map((note, index) => `${index + 1}. ${note}`).join("\n") : "Sin notas cargadas.";
  const sourcesBlock = input.legalSources.length > 0
    ? input.legalSources.map((source, index) => `${index + 1}. ${source.title} (${source.type}, ${source.area}, ${source.country})`).join("\n")
    : "Sin fuentes vinculadas.";

  return `
Sos un abogado litigante experto en derecho de ${input.country}. Analiza este expediente de manera breve, concreta y util para trabajo profesional.

Caratula: ${input.caratula}
Materia: ${input.area}
Pais: ${input.country}
Descripcion del caso:
${input.description || "Sin descripcion cargada."}

Notas del expediente:
${notesBlock}

Fuentes juridicas vinculadas:
${sourcesBlock}

  Responde SOLO en JSON con esta estructura exacta:
  {
  "resumen_caso": "Maximo 80 palabras.",
  "puntos_juridicos": ["Maximo 2 items, cada item maximo 25 palabras"],
  "riesgos": ["Maximo 2 items, cada item maximo 25 palabras"],
  "proximos_pasos": ["Maximo 3 items, cada item maximo 20 palabras"]
  }

No escribas parrafos largos. Se concreto, practico y breve.
  `.trim();
}

function buildOrganizeNotesPrompt(notes: string[], country: string, area: string, caratula: string) {
  const notesBlock = notes.length > 0 ? notes.map((note, index) => `${index + 1}. ${note}`).join("\n") : "Sin notas cargadas.";

  return `
Sos un abogado experto en derecho de ${country}. Ordena estas notas de expediente para trabajo profesional.

Caratula: ${caratula}
Materia: ${area}
Pais: ${country}

Notas:
${notesBlock}

  Responde SOLO en JSON con esta estructura exacta:
  {
  "hechos_relevantes": ["Maximo 3 items, cada item maximo 20 palabras"],
  "objetivo_del_caso": "Maximo 30 palabras.",
  "pendientes": ["Maximo 3 items, cada item maximo 20 palabras"],
  "prueba_a_reunir": ["Maximo 3 items, cada item maximo 20 palabras"],
  "lineas_de_argumento": ["Maximo 3 items, cada item maximo 20 palabras"]
  }

No redactes desarrollo largo. Solo orden practico y sintesis.
  `.trim();
}

export async function analyzeCaseWithDeps(
  input: CaseAnalysisInput,
  deps: {
    generateContent(prompt: string): Promise<GenerateContentResponse>;
  }
): Promise<CaseAnalysisResult> {
  if (!input.caratula.trim()) {
    return { success: false, error: "Faltan datos para analizar el expediente." };
  }

  try {
    const result = await deps.generateContent(buildCaseAnalysisPrompt(input));
    const parsed = parseJsonResult<CaseAnalysis>(result.response.text(), [
      "resumen_caso",
      "puntos_juridicos",
      "riesgos",
      "proximos_pasos",
    ]);

    if (!parsed) {
      return { success: false, error: "La IA devolvio un analisis de expediente invalido." };
    }

    return { success: true, analysis: parsed };
  } catch {
    return { success: false, error: "No se pudo completar el analisis del expediente con IA." };
  }
}

export async function organizeCaseNotesWithDeps(
  input: {
    notes: string[];
    country: string;
    area: string;
    caratula: string;
  },
  deps: {
    generateContent(prompt: string): Promise<GenerateContentResponse>;
  }
): Promise<OrganizedNotesResult> {
  if (input.notes.length === 0) {
    return { success: false, error: "No hay notas para ordenar con IA." };
  }

  try {
    const result = await deps.generateContent(
      buildOrganizeNotesPrompt(input.notes, input.country, input.area, input.caratula)
    );
    const parsed = parseJsonResult<OrganizedNotesAnalysis>(result.response.text(), [
      "hechos_relevantes",
      "objetivo_del_caso",
      "pendientes",
      "prueba_a_reunir",
      "lineas_de_argumento",
    ]);

    if (!parsed) {
      return { success: false, error: "La IA devolvio una organizacion de notas invalida." };
    }

    return { success: true, analysis: parsed };
  } catch {
    return { success: false, error: "No se pudieron ordenar las notas con IA." };
  }
}

export async function analyzeLegalModification(
  oldText: string,
  newText: string,
  country: string = "Argentina"
): Promise<LegalAnalysisResult> {
  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: "Falta configurar GEMINI_API_KEY en el archivo .env" };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  return analyzeLegalModificationWithDeps(oldText, newText, country, {
    generateContent(prompt) {
      return model.generateContent(prompt);
    },
  });
}

export async function analyzeLegalSourceSnapshot(
  input: LegalSourceSnapshotInput
): Promise<{ success: true; status: "OK" | "REVISAR" } | { success: false; error: string }> {
  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: "Falta configurar GEMINI_API_KEY en el archivo .env" };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  return analyzeLegalSourceSnapshotWithDeps(input, {
    generateContent(prompt) {
      return model.generateContent(prompt);
    },
  });
}

export async function analyzeOfficialLegalSourceVerification(
  input: OfficialLegalSourceVerificationInput
): Promise<{ success: true; status: "OK" | "REVISAR" } | { success: false; error: string }> {
  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: "Falta configurar GEMINI_API_KEY en el archivo .env" };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  return analyzeOfficialLegalSourceVerificationWithDeps(input, {
    generateContent(prompt) {
      return model.generateContent(prompt);
    },
  });
}

export async function analyzeCase(input: CaseAnalysisInput): Promise<CaseAnalysisResult> {
  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: "Falta configurar GEMINI_API_KEY en el archivo .env" };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  return analyzeCaseWithDeps(input, {
    generateContent(prompt) {
      return model.generateContent(prompt);
    },
  });
}

export async function summarizeOfficialLegalSource(input: {
  title: string;
  country: string;
  area: string;
  type: string;
  officialContent: string;
}): Promise<OfficialLegalSourceSummaryResult> {
  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: "Falta configurar GEMINI_API_KEY en el archivo .env" };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  return summarizeOfficialLegalSourceWithDeps(input, {
    generateContent(prompt) {
      return model.generateContent(prompt);
    },
  });
}

export async function summarizeManualLegalSource(input: {
  title: string;
  country: string;
  area: string;
  type: string;
  content: string;
  officialNumber?: string | null;
}): Promise<ManualLegalSourceSummaryResult> {
  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: "Falta configurar GEMINI_API_KEY en el archivo .env" };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  return summarizeManualLegalSourceWithDeps(input, {
    generateContent(prompt) {
      return model.generateContent(prompt);
    },
  });
}

export async function organizeCaseNotes(input: {
  notes: string[];
  country: string;
  area: string;
  caratula: string;
}): Promise<OrganizedNotesResult> {
  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: "Falta configurar GEMINI_API_KEY en el archivo .env" };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  return organizeCaseNotesWithDeps(input, {
    generateContent(prompt) {
      return model.generateContent(prompt);
    },
  });
}
