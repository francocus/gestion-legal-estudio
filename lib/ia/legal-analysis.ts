export interface LegalAnalysis {
  resumen_cambio: string;
  espiritu_legislador: string;
  tip_litigio: string;
}

export type LegalAnalysisResult =
  | { success: true; analysis: LegalAnalysis }
  | { success: false; error: string };

export function buildLegalAnalysisPrompt(oldText: string, newText: string, country: string) {
  return `
    Sos un abogado experto en derecho positivo de ${country} y en argumentacion juridica.
    Tu tarea es analizar una modificacion legislativa o normativa de ${country}.

    TEXTO ANTERIOR (DEROGADO):
    "${oldText}"

    TEXTO NUEVO (VIGENTE):
    "${newText}"

    Devolve tu respuesta ESTRICTAMENTE en formato JSON con la siguiente estructura exacta:
    {
      "resumen_cambio": "Explicacion breve de que cambio exactamente (maximo 2 lineas).",
      "espiritu_legislador": "Analisis profundo de cual es la intencion o espiritu detras de este cambio en la jurisprudencia de ${country}.",
      "tip_litigio": "Un consejo tactico para un abogado litigando en ${country}: como usar este cambio a favor de su cliente."
    }
  `;
}

export function parseLegalAnalysisResponse(rawText: string): LegalAnalysisResult {
  try {
    const cleanJson = rawText.replace(/```json\n?|```/g, "").trim();
    const parsed = JSON.parse(cleanJson) as Partial<LegalAnalysis>;

    if (!parsed.resumen_cambio || !parsed.espiritu_legislador || !parsed.tip_litigio) {
      return { success: false, error: "La IA devolvio una respuesta incompleta." };
    }

    return {
      success: true,
      analysis: {
        resumen_cambio: parsed.resumen_cambio,
        espiritu_legislador: parsed.espiritu_legislador,
        tip_litigio: parsed.tip_litigio,
      },
    };
  } catch {
    return { success: false, error: "La IA devolvio una respuesta invalida." };
  }
}
