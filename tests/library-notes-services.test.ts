import assert from "node:assert/strict";
import {
  createLegalSourceWithDeps,
  createNoteWithDeps,
  deleteLegalSourceWithDeps,
  deleteNoteWithDeps,
  markLegalSourceReviewedWithDeps,
  validateManualLegalSourceWithDeps,
  verifyOfficialLegalSourceUpdateWithDeps,
} from "@/lib/actions/services";

function createFormData(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

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
  await runTest("createLegalSourceWithDeps creates source and revalidates library", async () => {
    let created: Record<string, unknown> | null = null;
    const calls: string[] = [];

    const result = await createLegalSourceWithDeps(
      createFormData({
        title: "Ley 123",
        type: "LAW",
        area: "civil",
        country: "Argentina",
        content: "Texto vigente",
        sourceUrl: "https://example.com/norma",
      }),
      {
        async createLegalSource(data) {
          created = data;
          return null;
        },
        revalidatePath(path) {
          calls.push(path);
        },
      }
    );

    assert.deepEqual(result, { success: true });
    assert.deepEqual(created, {
      title: "Ley 123",
      type: "LAW",
      area: "CIVIL",
      country: "Argentina",
      content: "Texto vigente",
      officialText: null,
      sourceUrl: "https://example.com/norma",
      publicationDate: null,
      officialNumber: null,
      officialName: null,
      validityStatus: null,
      relatedRule: null,
      previousText: null,
    });
    assert.deepEqual(calls, ["/biblioteca"]);
  });

  await runTest("createLegalSourceWithDeps rejects incomplete payload", async () => {
    const result = await createLegalSourceWithDeps(createFormData({ title: "", type: "", area: "", content: "" }), {
      async createLegalSource() {
        throw new Error("no deberia crear");
      },
      revalidatePath() {},
    });

    assert.deepEqual(result, { success: false, error: "Faltan datos obligatorios de la fuente juridica." });
  });

  await runTest("createLegalSourceWithDeps rejects unsupported countries", async () => {
    const result = await createLegalSourceWithDeps(
      createFormData({
        title: "Norma X",
        type: "LAW",
        area: "civil",
        country: "Uruguay",
        content: "Texto",
      }),
      {
        async createLegalSource() {
          throw new Error("no deberia crear");
        },
        revalidatePath() {},
      }
    );

    assert.deepEqual(result, {
      success: false,
      error: "La biblioteca solo admite fuentes de Argentina o Paraguay.",
    });
  });

  await runTest("deleteLegalSourceWithDeps deletes and revalidates library", async () => {
    let deletedId: string | null = null;
    const calls: string[] = [];

    await deleteLegalSourceWithDeps("source-1", {
      async deleteLegalSource(id) {
        deletedId = id;
        return null;
      },
      revalidatePath(path) {
        calls.push(path);
      },
    });

    assert.equal(deletedId, "source-1");
    assert.deepEqual(calls, ["/biblioteca"]);
  });

  await runTest("markLegalSourceReviewedWithDeps updates and revalidates library", async () => {
    let reviewedId: string | null = null;
    const calls: string[] = [];

    await markLegalSourceReviewedWithDeps("source-2", {
      async markReviewed(id) {
        reviewedId = id;
        return null;
      },
      revalidatePath(path) {
        calls.push(path);
      },
    });

    assert.equal(reviewedId, "source-2");
    assert.deepEqual(calls, ["/biblioteca"]);
  });

  await runTest("verifyOfficialLegalSourceUpdateWithDeps syncs content and stores previous text when official source changed", async () => {
    let updated: Record<string, unknown> | null = null;
    const calls: string[] = [];

    const result = await verifyOfficialLegalSourceUpdateWithDeps("source-3", {
      async findLegalSource() {
        return {
          id: "source-3",
          title: "Ley 22278",
          type: "LAW",
          area: "PENAL",
          country: "Argentina",
          content: "Texto vigente viejo",
          officialText: "Texto vigente viejo",
          sourceUrl: "https://www.argentina.gob.ar/normativa/nacional/ley-22278-1234",
          publicationDate: null,
          officialNumber: null,
          officialName: null,
          validityStatus: null,
          relatedRule: null,
          previousText: null,
        };
      },
      async fetchOfficialText() {
        return "Ley 22278 PODER EJECUTIVO NACIONAL (P.E.N.) 25-ago-1980 MINORIDAD REGIMEN PENAL Publicada en el Boletin Oficial. Resumen: ESTABLECESE EL REGIMEN PENAL DE LA MINORIDAD. Observaciones: ABROGADA POR EL ARTICULO 48 DE LA LEY 27801. Vigencia: A LOS CIENTO OCHENTA DIAS.";
      },
      async analyzeOfficialVerification() {
        return { success: true, status: "REVISAR" };
      },
      async summarizeOfficialText() {
        return { success: true, summary: "Sintesis actualizada de la ley.", suggestedTitle: "Ley 22278 - Regimen penal juvenil" };
      },
      async updateLegalSource(_id, data) {
        updated = data;
        return null;
      },
      revalidatePath(path) {
        calls.push(path);
      },
    });

    assert.deepEqual(result, {
      success: true,
      message: "Se detecto una actualizacion oficial y la ley fue sincronizada.",
    });
    assert.equal(updated?.title, "Ley 22278 - Minoridad regimen penal");
    assert.equal(updated?.previousText, "Texto vigente viejo");
    assert.equal(updated?.content, "Sintesis actualizada de la ley.");
    assert.equal(updated?.officialText?.toString().includes("Resumen oficial:"), true);
    assert.equal(updated?.officialNumber, "22278");
    assert.equal(updated?.officialName, "Minoridad regimen penal");
    assert.equal(updated?.isOutdated, true);
    assert.deepEqual(calls, ["/biblioteca"]);
  });

  await runTest("verifyOfficialLegalSourceUpdateWithDeps keeps current text when no official change was detected", async () => {
    let updated: Record<string, unknown> | null = null;

    const result = await verifyOfficialLegalSourceUpdateWithDeps("source-4", {
      async findLegalSource() {
        return {
          id: "source-4",
          title: "Ley 100",
          type: "LAW",
          area: "CIVIL",
          country: "Argentina",
          content: "Resumen oficial: Texto vigente sin cambios sustanciales en la norma principal.",
          officialText: "Resumen oficial: Texto vigente sin cambios sustanciales en la norma principal.",
          sourceUrl: "https://www.argentina.gob.ar/normativa/nacional/ley-100-1234",
          publicationDate: null,
          officialNumber: null,
          officialName: null,
          validityStatus: null,
          relatedRule: null,
          previousText: null,
        };
      },
      async fetchOfficialText() {
        return "Ley 100 Publicada en el Boletin Oficial. Resumen: Texto vigente sin cambios sustanciales en la norma principal. Vigencia: plena.";
      },
      async analyzeOfficialVerification() {
        return { success: true, status: "OK" };
      },
      async summarizeOfficialText() {
        return { success: true, summary: "Sintesis estable de la norma.", suggestedTitle: "Ley 100" };
      },
      async updateLegalSource(_id, data) {
        updated = data;
        return null;
      },
      revalidatePath() {},
    });

    assert.deepEqual(result, {
      success: true,
      message: "No se detectaron cambios en la fuente oficial.",
    });
    assert.equal(updated?.content, "Sintesis estable de la norma.");
    assert.equal(updated?.previousText, null);
    assert.equal(updated?.isOutdated, false);
  });

  await runTest("validateManualLegalSourceWithDeps completes manual card when summary succeeds", async () => {
    let updated: Record<string, unknown> | null = null;

    const result = await validateManualLegalSourceWithDeps("source-manual-1", {
      async findLegalSource() {
        return {
          id: "source-manual-1",
          title: "REGIMEN PENAL JUVENIL",
          type: "LAW",
          area: "PENAL",
          country: "Argentina",
          content: "EL OBJETO DE LA PRESENTE LEY ES EL ESTABLECIMIENTO DEL REGIMEN PENAL...",
          sourceUrl: null,
          officialNumber: "27801",
          publicationDate: new Date("2026-03-09T12:00:00"),
        };
      },
      async analyzeSnapshot() {
        return { success: false, error: "sin control estructural" };
      },
      async summarizeManual() {
        return {
          success: true,
          suggestedTitle: "Ley 27801 - Regimen penal juvenil",
          summary: "Establece el regimen penal aplicable a personas adolescentes imputadas por hechos tipificados como delito.",
          suggestedType: "LAW",
          suggestedArea: "PENAL",
          suggestedPublicationDate: "09/03/2026",
        };
      },
      async updateLegalSource(_id, data) {
        updated = data;
        return null;
      },
      revalidatePath() {},
    });

    assert.deepEqual(result, {
      success: true,
      message: "La IA valido la fuente y completo la ficha manual.",
    });
    assert.equal(updated?.title, "Ley 27801 - Regimen Penal Juvenil");
    assert.equal(updated?.content, "Establece el regimen penal aplicable a personas adolescentes imputadas por hechos tipificados como delito.");
    assert.equal(updated?.type, "LAW");
    assert.equal(updated?.area, "PENAL");
    assert.equal((updated?.publicationDate as Date)?.toISOString?.().startsWith("2026-03-09"), true);
  });

  await runTest("validateManualLegalSourceWithDeps rejects manual validation when summary is not useful", async () => {
    let updateCalled = false;

    const result = await validateManualLegalSourceWithDeps("source-manual-2", {
      async findLegalSource() {
        return {
          id: "source-manual-2",
          title: "regimen penal juvenil",
          type: "LAW",
          area: "PENAL",
          country: "Argentina",
          content:
            "EL OBJETO DE LA PRESENTE LEY ES EL ESTABLECIMIENTO DEL REGIMEN PENAL APLICABLE A LAS PERSONAS ADOLESCENTES, DESDE LOS CATORCE ANOS DE EDAD...",
          sourceUrl: null,
          officialNumber: "27801",
          publicationDate: null,
        };
      },
      async analyzeSnapshot() {
        return { success: false, error: "sin control estructural" };
      },
      async summarizeManual() {
        return {
          success: true,
          suggestedTitle: "Ley 27801 - Regimen penal juvenil",
          summary:
            "EL OBJETO DE LA PRESENTE LEY ES EL ESTABLECIMIENTO DEL REGIMEN PENAL APLICABLE A LAS PERSONAS ADOLESCENTES, DESDE LOS CATORCE ANOS DE EDAD...",
          suggestedType: "LAW",
          suggestedArea: "CIVIL",
          suggestedPublicationDate: "",
        };
      },
      async updateLegalSource() {
        updateCalled = true;
        return null;
      },
      revalidatePath() {},
    });

    assert.deepEqual(result, {
      success: false,
      error: "La IA no pudo completar la ficha manual con informacion util.",
    });
    assert.equal(updateCalled, false);
  });

  await runTest("createNoteWithDeps creates note and revalidates case detail", async () => {
    let created: Record<string, unknown> | null = null;
    const calls: string[] = [];

    const result = await createNoteWithDeps("case-1", "client-1", "  idea principal  ", "TEXT", {
      async createNote(data) {
        created = data;
        return null;
      },
      revalidatePath(path) {
        calls.push(path);
      },
    });

    assert.deepEqual(result, { success: true });
    assert.deepEqual(created, {
      content: "idea principal",
      type: "TEXT",
      caseId: "case-1",
    });
    assert.deepEqual(calls, ["/client/client-1/case/case-1"]);
  });

  await runTest("createNoteWithDeps rejects empty content", async () => {
    const result = await createNoteWithDeps("case-1", "client-1", "   ", "TEXT", {
      async createNote() {
        throw new Error("no deberia crear");
      },
      revalidatePath() {},
    });

    assert.deepEqual(result, { success: false, error: "La nota no puede estar vacia." });
  });

  await runTest("deleteNoteWithDeps deletes note and revalidates case detail", async () => {
    let deletedId: string | null = null;
    const calls: string[] = [];

    await deleteNoteWithDeps("note-9", "case-9", "client-9", {
      async deleteNote(id) {
        deletedId = id;
        return null;
      },
      revalidatePath(path) {
        calls.push(path);
      },
    });

    assert.equal(deletedId, "note-9");
    assert.deepEqual(calls, ["/client/client-9/case/case-9"]);
  });
})();
