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
