const ARGENTINA_OFFICIAL_HOSTS = ["infoleg.gob.ar", "servicios.infoleg.gob.ar", "argentina.gob.ar"];
const PARAGUAY_OFFICIAL_HOSTS = ["pj.gov.py", "csj.gov.py", "bacn.gov.py", "paraguay.gov.py", "gacetaoficial.gov.py"];

export interface OfficialSourceMatch {
  recognized: boolean;
  preferred: boolean;
  label: string | null;
}

function matchesHost(hostname: string, hosts: string[]) {
  return hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

export function detectOfficialLegalSource(url: string | null | undefined, country: string): OfficialSourceMatch {
  if (!url) {
    return {
      recognized: false,
      preferred: false,
      label: null,
    };
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    if (country === "Argentina") {
      if (matchesHost(hostname, ARGENTINA_OFFICIAL_HOSTS)) {
        return {
          recognized: true,
          preferred: hostname.includes("infoleg") || parsed.pathname.includes("/normativa"),
          label: "InfoLEG / Normativa Argentina",
        };
      }
    }

    if (country === "Paraguay") {
      if (matchesHost(hostname, PARAGUAY_OFFICIAL_HOSTS)) {
        return {
          recognized: true,
          preferred: hostname.includes("pj.gov.py") || hostname.includes("csj.gov.py") || hostname.includes("bacn.gov.py"),
          label: "Base de Legislacion Paraguaya / CSJ - IIJ",
        };
      }
    }
  } catch {
    return {
      recognized: false,
      preferred: false,
      label: null,
    };
  }

  return {
    recognized: false,
    preferred: false,
    label: null,
  };
}

export function detectOfficialStatusSignals(text: string) {
  const normalized = text.toLowerCase();

  const reviewPatterns = [
    /derogad[ao]s?/,
    /abrogad[ao]s?/,
    /sustituid[ao]s?/,
    /modificad[ao]s?/,
    /texto ordenado/,
    /vigencia:/,
    /observacion:/,
    /remite a la ley/,
    /queda sin efecto/,
    /reemplazad[ao]s?/,
  ];

  const matchedPattern = reviewPatterns.find((pattern) => pattern.test(normalized));

  return {
    shouldReview: Boolean(matchedPattern),
    reason: matchedPattern ? matchedPattern.source : null,
  };
}
