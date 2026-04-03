function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/Ã¡/g, "á")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã±/g, "ñ")
    .replace(/Ã/g, "Á")
    .replace(/Ã‰/g, "É")
    .replace(/Ã/g, "Í")
    .replace(/Ã“/g, "Ó")
    .replace(/Ãš/g, "Ú")
    .replace(/Ã‘/g, "Ñ")
    .replace(/Â°/g, "°")
    .replace(/Âº/g, "º")
    .replace(/Âª/g, "ª")
    .replace(/Â/g, "")
    .replace(/�/g, "");
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
  officialNumber: string | null;
  officialName: string | null;
  validityStatus: string | null;
  relatedRule: string | null;
  publicationDate: Date | null;
}

function parseSpanishMonth(monthText: string) {
  const months: Record<string, number> = {
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

  return months[monthText.toLowerCase().slice(0, 3)] ?? null;
}

function extractPublicationDate(text: string) {
  const fullDateMatch = text.match(/publicad[ao][\s\S]{0,120}?(?:del\s+)?(\d{1,2})[-/ ]([a-záéíóúA-ZÁÉÍÓÚ]{3,})[-/ ](\d{2,4})/i);
  if (fullDateMatch) {
    const month = parseSpanishMonth(fullDateMatch[2]);
    if (month !== null) {
      const year = fullDateMatch[3].length === 2 ? Number(`19${fullDateMatch[3]}`) : Number(fullDateMatch[3]);
      return new Date(year, month, Number(fullDateMatch[1]), 12, 0, 0);
    }
  }

  const numericDateMatch = text.match(/publicad[ao][\s\S]{0,120}?(?:del\s+)?(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/i);
  if (numericDateMatch) {
    const year = numericDateMatch[3].length === 2 ? Number(`19${numericDateMatch[3]}`) : Number(numericDateMatch[3]);
    return new Date(year, Number(numericDateMatch[2]) - 1, Number(numericDateMatch[1]), 12, 0, 0);
  }

  const fallbackDateMatch = text.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/);
  if (fallbackDateMatch) {
    return new Date(Number(fallbackDateMatch[3]), Number(fallbackDateMatch[2]) - 1, Number(fallbackDateMatch[1]), 12, 0, 0);
  }

  return null;
}

export function inferPublicationDateFromText(...values: Array<string | null | undefined>) {
  const combined = values.filter(Boolean).join(" ");
  if (!combined.trim()) {
    return null;
  }
  return extractPublicationDate(combined);
}

export function inferArgentinaLawNumber(...values: Array<string | null | undefined>) {
  const combined = values.filter(Boolean).join(" ");
  const match = combined.match(/\bley\s*(\d{4,6})\b/i) ?? combined.match(/\b(\d{4,6})\b/);
  return match?.[1] ?? null;
}

export function extractArgentinaOfficialUrlFromSearchHtml(html: string, lawNumber: string) {
  return extractArgentinaOfficialUrlsFromSearchHtml(html, lawNumber)[0] ?? null;
}

export function extractArgentinaOfficialUrlsFromSearchHtml(html: string, lawNumber: string) {
  const decoded = decodeHtmlEntities(html);
  const matches = new Set<string>();
  const patterns = [
    new RegExp(`https?:\\/\\/www\\.argentina\\.gob\\.ar\\/normativa\\/nacional\\/ley-${lawNumber}-[^"'\\s<]+(?:\\/texto|\\/actualizacion|\\/normas-modificadas|\\/normas-modifican)?`, "ig"),
    new RegExp(`uddg=https?%3A%2F%2Fwww\\.argentina\\.gob\\.ar%2Fnormativa%2Fnacional%2Fley-${lawNumber}-[^"'\\s<]+`, "ig"),
  ];

  for (const pattern of patterns) {
    const found = decoded.match(pattern) ?? [];
    for (const item of found) {
      const normalized = item.startsWith("uddg=")
        ? decodeURIComponent(item.replace(/^uddg=/, ""))
        : item;
      matches.add(normalized.replace(/\/(normas-modificadas|normas-modifican|actualizacion)$/, ""));
    }
  }

  return Array.from(matches);
}

function extractLawNumber(text: string) {
  return extractRegexGroup(text, /ley\s+(\d{4,6})/i);
}

function extractOfficialName(text: string) {
  const title = buildInfolegTitle(text);
  if (!title || !title.includes(" - ")) {
    return null;
  }

  return title.split(" - ").slice(1).join(" - ").trim();
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

function extractParaguayBaseLawNumber(text: string) {
  const match = text.match(/ley\s*(?:n[°ºo.]?\s*)?(\d{1,5})(?:\/(\d{2,4}))?/i);
  if (!match) return null;
  return {
    number: match[1],
    yearPart: match[2] ?? null,
  };
}

function buildParaguayOfficialNumber(text: string, publicationDate: Date | null) {
  const extracted = extractParaguayBaseLawNumber(text);
  if (!extracted) return null;
  if (extracted.yearPart) {
    const suffix = extracted.yearPart.length === 4 ? extracted.yearPart.slice(-2) : extracted.yearPart;
    return `${extracted.number}/${suffix}`;
  }
  if (publicationDate) {
    return `${extracted.number}/${String(publicationDate.getFullYear()).slice(-2)}`;
  }
  return extracted.number;
}

function buildParaguayTitle(text: string, publicationDate: Date | null) {
  const officialNumber = buildParaguayOfficialNumber(text, publicationDate);
  const cleaned = normalizeWhitespace(text);
  const explicitCode = cleaned.match(/c[oó]digo\s+del\s+trabajo/i)
    ?? cleaned.match(/c[oó]digo\s+penal/i)
    ?? cleaned.match(/c[oó]digo\s+civil/i)
    ?? cleaned.match(/c[oó]digo\s+procesal\s+penal/i)
    ?? cleaned.match(/c[oó]digo\s+procesal\s+civil/i)
    ?? cleaned.match(/constituci[oó]n\s+nacional/i);

  let officialName: string | null = explicitCode ? toLegalTitleCase(explicitCode[0]) : null;

  if (!officialName) {
    const afterLaw = cleaned
      .replace(/^ley\s*(?:n[°ºo.]?\s*)?\d{1,5}(?:\/\d{2,4})?\s*/i, "")
      .replace(/^que\s+establece\s+/i, "")
      .replace(/^por\s+la\s+cual\s+se\s+/i, "")
      .replace(/^se\s+/i, "")
      .split(".")[0]
      .trim();

    if (afterLaw) {
      officialName = toLegalTitleCase(afterLaw);
    }
  }

  if (!officialNumber && !officialName) {
    return null;
  }
  if (!officialNumber) {
    return officialName;
  }
  if (!officialName) {
    return `Ley ${officialNumber}`;
  }
  return `Ley ${officialNumber} - ${officialName}`;
}

function extractParaguayOfficialName(text: string, publicationDate: Date | null) {
  const title = buildParaguayTitle(text, publicationDate);
  if (!title || !title.includes(" - ")) {
    return null;
  }
  return title.split(" - ").slice(1).join(" - ").trim();
}

function extractRelatedRule(text: string) {
  const explicitLaw = extractRegexGroup(text, /(?:derogada|abrogada|modificada|sustituida)[\s\S]{0,80}?(ley\s+\d{4,6})/i);
  if (explicitLaw) {
    return explicitLaw
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^ley\s+/i, "Ley ");
  }

  const articleLaw = extractRegexGroup(text, /art(?:iculo)?\.?\s*\d+[\s\S]{0,40}?(ley\s+\d{4,6})/i);
  return articleLaw
    ? articleLaw
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^ley\s+/i, "Ley ")
    : null;
}

function inferValidityStatus(text: string) {
  const normalized = text.toLowerCase();

  if (/derogad[ao]s?|abrogad[ao]s?|queda sin efecto/.test(normalized)) {
    return "Derogada";
  }

  if (/sustituid[ao]s?|texto ordenado|modificad[ao]s?/.test(normalized)) {
    return "Modificada";
  }

  if (/vigencia:/.test(normalized)) {
    return "Vigente";
  }

  return null;
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
  const publicationDate = extractPublicationDate(normalizedText);

  if (country === "Argentina" && /infoleg|argentina\.gob\.ar/i.test(sourceUrl)) {
    const officialNumber = extractLawNumber(normalizedText);
    const officialName = extractOfficialName(normalizedText);

    return {
      officialText: normalizedText,
      normalizedTitle: buildInfolegTitle(normalizedText),
      normalizedContent: extractOfficialSummary(normalizedText),
      officialNumber,
      officialName,
      validityStatus: inferValidityStatus(normalizedText),
      relatedRule: extractRelatedRule(normalizedText),
      publicationDate,
    };
  }

  if (country === "Paraguay" && /pj\.gov\.py|csj\.gov\.py|bacn\.gov\.py/i.test(sourceUrl)) {
    const officialNumber = buildParaguayOfficialNumber(normalizedText, publicationDate);
    const officialName = extractParaguayOfficialName(normalizedText, publicationDate);

    return {
      officialText: normalizedText,
      normalizedTitle: buildParaguayTitle(normalizedText, publicationDate),
      normalizedContent: extractOfficialSummary(normalizedText),
      officialNumber,
      officialName,
      validityStatus: inferValidityStatus(normalizedText),
      relatedRule: extractRelatedRule(normalizedText),
      publicationDate,
    };
  }

  return {
    officialText: normalizedText,
    normalizedTitle: null,
    normalizedContent: normalizedText.slice(0, 1200),
    officialNumber: null,
    officialName: null,
    validityStatus: inferValidityStatus(normalizedText),
    relatedRule: extractRelatedRule(normalizedText),
    publicationDate,
  };
}

export async function findArgentinaLawSourceUrl(input: { title?: string | null; content?: string | null }) {
  const candidates = await findArgentinaLawSourceCandidates(input);
  return candidates[0] ?? null;
}

export async function findArgentinaLawSourceCandidates(input: { title?: string | null; content?: string | null }) {
  const lawNumber = inferArgentinaLawNumber(input.title, input.content);
  if (!lawNumber) {
    return [];
  }

  const queries = [
    `site:argentina.gob.ar/normativa/nacional/ley-${lawNumber} "Ley ${lawNumber}"`,
    `site:argentina.gob.ar "Ley ${lawNumber}" argentina normativa`,
  ];

  const collected = new Set<string>();

  try {
    for (const rawQuery of queries) {
      const query = encodeURIComponent(rawQuery);
      const response = await fetch(`https://html.duckduckgo.com/html/?q=${query}`, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "text/html,application/xhtml+xml",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        continue;
      }

      const html = await response.text();
      const urls = extractArgentinaOfficialUrlsFromSearchHtml(html, lawNumber);
      for (const url of urls) {
        collected.add(url);
      }
    }
  } catch {
    return Array.from(collected);
  }

  return Array.from(collected);
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
