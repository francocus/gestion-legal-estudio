import assert from "node:assert/strict";
import {
  analyzeLegalModificationWithDeps,
  analyzeCaseWithDeps,
  organizeCaseNotesWithDeps,
  analyzeLegalSourceSnapshotWithDeps,
  analyzeOfficialLegalSourceVerificationWithDeps,
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

  await runTest("analyzeLegalSourceSnapshotWithDeps marks source as OK when IA confirms", async () => {
    const result = await analyzeLegalSourceSnapshotWithDeps(
      {
        title: "Ley 123",
        content: "Texto de prueba",
        country: "Argentina",
        area: "CIVIL",
        type: "LAW",
      },
      {
        async generateContent() {
          return {
            response: {
              text() {
                return "OK";
              },
            },
          };
        },
      }
    );

    assert.deepEqual(result, { success: true, status: "OK" });
  });

  await runTest("analyzeLegalSourceSnapshotWithDeps marks source for review when IA asks to review", async () => {
    const result = await analyzeLegalSourceSnapshotWithDeps(
      {
        title: "Ley 123",
        content: "Texto de prueba",
        country: "Paraguay",
        area: "CIVIL",
        type: "LAW",
      },
      {
        async generateContent() {
          return {
            response: {
              text() {
                return "REVISAR";
              },
            },
          };
        },
      }
    );

    assert.deepEqual(result, { success: true, status: "REVISAR" });
  });

  await runTest("analyzeOfficialLegalSourceVerificationWithDeps marks source for review when official text suggests derogation", async () => {
    const result = await analyzeOfficialLegalSourceVerificationWithDeps(
      {
        title: "Ley 22788",
        content: "Texto oficial",
        originalContent: "Texto cargado",
        officialContent: "Derogada por la Ley 27801.",
        sourceUrl: "https://infoleg.test/22788",
        country: "Argentina",
        area: "PENAL",
        type: "LAW",
      },
      {
        async generateContent() {
          return {
            response: {
              text() {
                return "REVISAR";
              },
            },
          };
        },
      }
    );

    assert.deepEqual(result, { success: true, status: "REVISAR" });
  });

  await runTest("analyzeCaseWithDeps returns structured case analysis", async () => {
    const result = await analyzeCaseWithDeps(
      {
        country: "Argentina",
        caratula: "Perez c/ Gomez",
        area: "LABORAL",
        description: "Despido sin causa.",
        notes: ["Hubo telegrama.", "Falta liquidacion final."],
        legalSources: [{ title: "LCT", type: "CODE", area: "LABORAL", country: "Argentina" }],
      },
      {
        async generateContent() {
          return {
            response: {
              text() {
                return JSON.stringify({
                  resumen_caso: "Despido laboral con reclamo indemnizatorio.",
                  puntos_juridicos: ["Despido", "Liquidacion final"],
                  riesgos: ["Prueba documental incompleta"],
                  proximos_pasos: ["Reunir recibos"],
                });
              },
            },
          };
        },
      }
    );

    assert.deepEqual(result, {
      success: true,
      analysis: {
        resumen_caso: "Despido laboral con reclamo indemnizatorio.",
        puntos_juridicos: ["Despido", "Liquidacion final"],
        riesgos: ["Prueba documental incompleta"],
        proximos_pasos: ["Reunir recibos"],
      },
    });
  });

  await runTest("organizeCaseNotesWithDeps returns ordered notes", async () => {
    const result = await organizeCaseNotesWithDeps(
      {
        notes: ["Cliente dice que no le pagaron.", "Hay intercambio de mensajes."],
        country: "Paraguay",
        area: "CIVIL",
        caratula: "Suarez s/ cobro",
      },
      {
        async generateContent() {
          return {
            response: {
              text() {
                return JSON.stringify({
                  hechos_relevantes: ["Falta de pago", "Mensajes de reclamo"],
                  objetivo_del_caso: "Cobrar el credito adeudado.",
                  pendientes: ["Confirmar monto exacto"],
                  prueba_a_reunir: ["Comprobantes", "Mensajes"],
                  lineas_de_argumento: ["Incumplimiento contractual"],
                });
              },
            },
          };
        },
      }
    );

    assert.deepEqual(result, {
      success: true,
      analysis: {
        hechos_relevantes: ["Falta de pago", "Mensajes de reclamo"],
        objetivo_del_caso: "Cobrar el credito adeudado.",
        pendientes: ["Confirmar monto exacto"],
        prueba_a_reunir: ["Comprobantes", "Mensajes"],
        lineas_de_argumento: ["Incumplimiento contractual"],
      },
    });
  });
})();
