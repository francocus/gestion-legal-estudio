import assert from "node:assert/strict";
import {
  analyzeLegalModificationWithDeps,
} from "@/lib/actions/ia";
import {
  buildLegalAnalysisPrompt,
  parseLegalAnalysisResponse,
} from "@/lib/ia/legal-analysis";

async function runTest(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

void (async () => {
  await runTest("parseLegalAnalysisResponse parses valid JSON payload", () => {
    const result = parseLegalAnalysisResponse(`{"resumen_cambio":"Cambio breve","espiritu_legislador":"Analisis","tip_litigio":"Consejo"}`);

    assert.deepEqual(result, {
      success: true,
      analysis: {
        resumen_cambio: "Cambio breve",
        espiritu_legislador: "Analisis",
        tip_litigio: "Consejo",
      },
    });
  });

  await runTest("parseLegalAnalysisResponse rejects invalid JSON payload", () => {
    const result = parseLegalAnalysisResponse("respuesta libre");
    assert.deepEqual(result, { success: false, error: "La IA devolvio una respuesta invalida." });
  });

  await runTest("buildLegalAnalysisPrompt includes country and both texts", () => {
    const prompt = buildLegalAnalysisPrompt("texto viejo", "texto nuevo", "Paraguay");

    assert.match(prompt, /Paraguay/);
    assert.match(prompt, /texto viejo/);
    assert.match(prompt, /texto nuevo/);
  });

  await runTest("analyzeLegalModificationWithDeps returns parsed analysis", async () => {
    const result = await analyzeLegalModificationWithDeps("viejo", "nuevo", "Argentina", {
      async generateContent() {
        return {
          response: {
            text() {
              return '{"resumen_cambio":"Cambio breve","espiritu_legislador":"Analisis","tip_litigio":"Consejo"}';
            },
          },
        };
      },
    });

    assert.deepEqual(result, {
      success: true,
      analysis: {
        resumen_cambio: "Cambio breve",
        espiritu_legislador: "Analisis",
        tip_litigio: "Consejo",
      },
    });
  });

  await runTest("analyzeLegalModificationWithDeps rejects missing texts", async () => {
    const result = await analyzeLegalModificationWithDeps("", "nuevo", "Argentina", {
      async generateContent() {
        throw new Error("no deberia llamar a la IA");
      },
    });

    assert.deepEqual(result, {
      success: false,
      error: "Tenes que pegar ambos textos para analizar la modificatoria.",
    });
  });

  await runTest("analyzeLegalModificationWithDeps handles provider failures", async () => {
    const result = await analyzeLegalModificationWithDeps("viejo", "nuevo", "Argentina", {
      async generateContent() {
        throw new Error("boom");
      },
    });

    assert.deepEqual(result, {
      success: false,
      error: "No se pudo completar el analisis con IA.",
    });
  });
})();
