function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function normalizeWhitespace(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toSentenceCase(value: string) {
  const lowered = value.toLowerCase();
  return lowered.charAt(0).toUpperCase() + lowered.slice(1);
}

function extractRegexGroup(text: string, regex: RegExp) {
  const match = text.match(regex);
  return match?.[1] ? normalizeWhitespace(match[1]) : null;
}

function buildInfolegTitle(text: string) {
  const lawNumber = extractRegexGroup(text, /ley\s+(\d{4,6})/i);
  const subjectBlock = extractRegexGroup(
    text,
    /ley\s+\d{4,6}[\s\S]{0,120}?((?:[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ()\-]+\s*){2,12})\s+Publicad/i
  );

  if (!lawNumber) {
    return null;
  }

  const cleanedSubject = subjectBlock
    ?.replace(/PODER EJECUTIVO NACIONAL\s*\(P\.?E\.?N\.?\)/gi, "")
    .replace(/\b\d{1,2}[-/][a-z]{3}[-/]\d{2,4}\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!cleanedSubject) {
    return `Ley ${lawNumber}`;
  }

  return `Ley ${lawNumber} - ${toSentenceCase(cleanedSubject)}`;
}

function extractOfficialSummary(text: string) {
  const resumen = extractRegexGroup(text, /resumen:\s*([\s\S]{20,300}?)(?:observaciones:|vigencia:|texto completo|copyright|$)/i);
  const observaciones = extractRegexGroup(text, /observaciones:\s*([\s\S]{10,260}?)(?:vigencia:|texto completo|copyright|$)/i);
  const vigencia = extractRegexGroup(text, /vigencia:\s*([\s\S]{10,220}?)(?:texto completo|copyright|$)/i);

  const blocks = [
    resumen ? `Resumen oficial: ${resumen}` : null,
    observaciones ? `Observaciones oficiales: ${observaciones}` : null,
    vigencia ? `Vigencia detectada: ${vigencia}` : null,
  ].filter(Boolean);

  if (blocks.length > 0) {
    return blocks.join("\n\n");
  }

  return text.split(/\.\s+/).slice(0, 3).join(". ").trim();
}

export interface OfficialLegalSnapshot {
  officialText: string;
  normalizedTitle: string | null;
  normalizedContent: string;
}

export function extractReadableLegalTextFromHtml(html: string) {
  const articleMatch =
    html.match(/<article[\s\S]*?<\/article>/i) ??
    html.match(/<main[\s\S]*?<\/main>/i) ??
    html.match(/<body[\s\S]*?<\/body>/i);

  const base = articleMatch?.[0] ?? html;

  return decodeHtmlEntities(
    base
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

export function buildOfficialLegalSnapshot(sourceUrl: string, officialText: string, country: string): OfficialLegalSnapshot {
  const normalizedText = normalizeWhitespace(officialText);

  if (country === "Argentina" && /infoleg|argentina\.gob\.ar/i.test(sourceUrl)) {
    return {
      officialText: normalizedText,
      normalizedTitle: buildInfolegTitle(normalizedText),
      normalizedContent: extractOfficialSummary(normalizedText),
    };
  }

  return {
    officialText: normalizedText,
    normalizedTitle: null,
    normalizedContent: normalizedText.slice(0, 1200),
  };
}

export async function fetchOfficialLegalText(sourceUrl: string) {
  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    const raw = await response.text();

    if (contentType.includes("text/html") || raw.includes("<html")) {
      const extracted = extractReadableLegalTextFromHtml(raw);
      return extracted.length >= 120 ? extracted : null;
    }

    const normalized = raw.trim();
    return normalized.length >= 120 ? normalized : null;
  } catch {
    return null;
  }
}
