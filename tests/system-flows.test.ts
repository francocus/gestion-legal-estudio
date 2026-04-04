import assert from "node:assert/strict";
import {
  attachLegalSourceToCaseWithDeps,
  createAccountEntryWithDeps,
  createAgendaEventWithDeps,
  createCaseWithDeps,
  createClientWithDeps,
  createLegalSourceWithDeps,
  createMovementWithDeps,
  createNoteWithDeps,
  createTransactionWithDeps,
  detachLegalSourceFromCaseWithDeps,
  editCaseWithDeps,
} from "@/lib/actions/services";
import { analyzeLegalModificationWithDeps } from "@/lib/actions/ia";

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
  await runTest("workflow creates client case agenda cash and legal source link", async () => {
    const revalidated: string[] = [];
    const clients: Array<Record<string, unknown>> = [];
    const cases: Array<Record<string, unknown>> = [];
    const agendaEvents: Array<Record<string, unknown>> = [];
    const movements: Array<Record<string, unknown>> = [];
    const transactions: Array<Record<string, unknown>> = [];
    const accountEntries: Array<Record<string, unknown>> = [];
    const caseSources: Array<Record<string, unknown>> = [];

    const clientId = "client-flow-1";
    const caseId = "case-flow-1";
    const legalSourceId = "source-flow-1";

    const clientResult = await createClientWithDeps(
      createFormData({
        firstName: "Laura",
        lastName: "Suarez",
        docType: "DNI",
        email: "laura@test.com",
      }),
      {
        async createClient(data) {
          clients.push({ id: clientId, ...data });
          return null;
        },
        revalidatePath(path) {
          revalidated.push(path);
        },
      }
    );

    assert.deepEqual(clientResult, { success: true });
    assert.equal(clients.length, 1);

    const caseResult = await createCaseWithDeps(
      createFormData({
        clientId,
        caratula: "Suarez c/ Empresa",
        description: "Despido sin causa",
        area: "LABORAL",
        isExtrajudicial: "false",
        code: "LAB-001",
        juzgado: "Laboral 2",
      }),
      {
        async createCase(data) {
          cases.push({ id: caseId, ...data });
          return null;
        },
        revalidatePath(path) {
          revalidated.push(path);
        },
      }
    );

    assert.deepEqual(caseResult, { success: true });
    assert.equal(cases.length, 1);

    const eventResult = await createAgendaEventWithDeps(
      createFormData({
        title: "Audiencia preliminar",
        date: "2026-06-10T09:30",
        type: "HEARING",
        description: "Sala 4",
        caseId,
      }),
      {
        async createEvent(data) {
          agendaEvents.push({ id: "event-flow-1", ...data });
          return null;
        },
        revalidatePath(path) {
          revalidated.push(path);
        },
      }
    );

    assert.deepEqual(eventResult, { success: true });
    assert.equal(agendaEvents.length, 1);

    const movementResult = await createMovementWithDeps(
      createFormData({
        caseId,
        clientId,
        title: "Contestacion presentada",
        description: "Escrito subido al expediente",
        date: "2026-06-09",
      }),
      {
        async createMovement(data) {
          movements.push({ id: "movement-flow-1", ...data });
          return { id: "movement-flow-1" };
        },
        revalidatePath(path) {
          revalidated.push(path);
        },
      }
    );

    assert.deepEqual(movementResult, { success: true });
    assert.equal(movements.length, 1);

    const transactionResult = await createTransactionWithDeps(
      createFormData({
        caseId,
        clientId,
        description: "Adelanto de honorarios",
        amount: "35000",
        type: "INCOME",
      }),
      {
        async createTransaction(data) {
          transactions.push({ id: "trx-flow-1", ...data });
          return null;
        },
        revalidatePath(path) {
          revalidated.push(path);
        },
      }
    );

    assert.deepEqual(transactionResult, { success: true });
    assert.equal(transactions.length, 1);

    const accountingResult = await createAccountEntryWithDeps(
      {
        date: "2026-06-09",
        description: "Adelanto registrado",
        concept: "Honorarios",
        debe: 0,
        haber: 35000,
        caseId,
      },
      {
        async createAccountEntry(data) {
          accountEntries.push({ id: "acc-flow-1", ...data });
          return { id: "acc-flow-1" };
        },
        revalidatePath(path) {
          revalidated.push(path);
        },
      }
    );

    assert.deepEqual(accountingResult, { success: true, entry: { id: "acc-flow-1" } });
    assert.equal(accountEntries.length, 1);

    const linkResult = await attachLegalSourceToCaseWithDeps(
      createFormData({
        caseId,
        clientId,
        legalSourceId,
      }),
      {
        async attach(linkedCaseId, linkedLegalSourceId) {
          caseSources.push({ caseId: linkedCaseId, legalSourceId: linkedLegalSourceId });
          return null;
        },
        revalidatePath(path) {
          revalidated.push(path);
        },
      }
    );

    assert.deepEqual(linkResult, { success: true });
    assert.deepEqual(caseSources, [{ caseId, legalSourceId }]);

    assert.equal(revalidated.includes("/"), true);
    assert.equal(revalidated.includes(`/client/${clientId}`), true);
    assert.equal(revalidated.includes("/agenda"), true);
    assert.equal(revalidated.includes(`/client/${clientId}/case/${caseId}`), true);
    assert.equal(revalidated.includes("/contabilidad"), true);
  });

  await runTest("workflow blocks invalid case before downstream records are created", async () => {
    const created: string[] = [];

    const caseResult = await createCaseWithDeps(
      createFormData({
        clientId: "",
        caratula: "",
        description: "Sin datos",
        area: "CIVIL",
        isExtrajudicial: "false",
        code: "",
        juzgado: "",
      }),
      {
        async createCase() {
          created.push("case");
          return null;
        },
        revalidatePath() {},
      }
    );

    assert.deepEqual(caseResult, { success: false, error: "Faltan datos obligatorios del expediente." });
    assert.deepEqual(created, []);
  });

  await runTest("workflow builds legal strategy from library note and IA analysis", async () => {
    const revalidated: string[] = [];
    const legalSources: Array<Record<string, unknown>> = [];
    const noteEntries: Array<Record<string, unknown>> = [];
    const caseSources: Array<Record<string, unknown>> = [];
    const prompts: string[] = [];

    const clientId = "client-flow-2";
    const caseId = "case-flow-2";
    const legalSourceId = "source-flow-2";

    const sourceResult = await createLegalSourceWithDeps(
      createFormData({
        title: "Ley de Contrato de Trabajo",
        type: "LAW",
        area: "laboral",
        country: "Argentina",
        content: "Texto vigente del articulo laboral.",
        sourceUrl: "https://ejemplo.test/lct",
      }),
      {
        async createLegalSource(data) {
          legalSources.push({ id: legalSourceId, ...data });
          return null;
        },
        revalidatePath(path) {
          revalidated.push(path);
        },
      }
    );

    assert.deepEqual(sourceResult, { success: true });
    assert.equal(legalSources.length, 1);
    assert.equal(legalSources[0]?.area, "LABORAL");

    const linkResult = await attachLegalSourceToCaseWithDeps(
      createFormData({
        caseId,
        clientId,
        legalSourceId,
      }),
      {
        async attach(linkedCaseId, linkedLegalSourceId) {
          caseSources.push({ caseId: linkedCaseId, legalSourceId: linkedLegalSourceId });
          return null;
        },
        revalidatePath(path) {
          revalidated.push(path);
        },
      }
    );

    assert.deepEqual(linkResult, { success: true });
    assert.deepEqual(caseSources, [{ caseId, legalSourceId }]);

    const noteResult = await createNoteWithDeps(
      caseId,
      clientId,
      "Plantear inconstitucionalidad por afectacion del principio protectorio.",
      "STRATEGY",
      {
        async createNote(data) {
          noteEntries.push({ id: "note-flow-1", ...data });
          return null;
        },
        revalidatePath(path) {
          revalidated.push(path);
        },
      }
    );

    assert.deepEqual(noteResult, { success: true });
    assert.equal(noteEntries.length, 1);

    const analysisResult = await analyzeLegalModificationWithDeps(
      "Texto anterior del articulo.",
      "Texto nuevo del articulo con restriccion de derechos.",
      "Argentina",
      {
        async generateContent(prompt) {
          prompts.push(prompt);
          return {
            response: {
              text() {
                return '{"resumen_cambio":"Se restringe un derecho laboral","espiritu_legislador":"Reducir el alcance de la proteccion","tip_litigio":"Comparar el texto anterior y fundar afectacion constitucional"}';
              },
            },
          };
        },
      }
    );

    assert.deepEqual(analysisResult, {
      success: true,
      analysis: {
        resumen_cambio: "Se restringe un derecho laboral",
        espiritu_legislador: "Reducir el alcance de la proteccion",
        tip_litigio: "Comparar el texto anterior y fundar afectacion constitucional",
      },
    });

    assert.equal(prompts.length, 1);
    assert.match(prompts[0] ?? "", /Argentina/);
    assert.match(prompts[0] ?? "", /Texto anterior del articulo/);
    assert.match(prompts[0] ?? "", /Texto nuevo del articulo con restriccion de derechos/);
    assert.equal(revalidated.includes("/biblioteca"), true);
    assert.equal(revalidated.includes(`/client/${clientId}/case/${caseId}`), true);
  });

  await runTest("workflow rejects invalid legal source and empty strategic note before persisting", async () => {
    const persisted: string[] = [];

    const sourceResult = await createLegalSourceWithDeps(
      createFormData({
        title: "",
        type: "LAW",
        area: "",
        country: "Argentina",
        content: "",
        sourceUrl: "",
      }),
      {
        async createLegalSource() {
          persisted.push("source");
          return null;
        },
        revalidatePath() {},
      }
    );

    assert.deepEqual(sourceResult, {
      success: false,
      error: "Faltan datos obligatorios de la fuente juridica.",
    });

    const noteResult = await createNoteWithDeps(
      "case-flow-3",
      "client-flow-3",
      "   ",
      "STRATEGY",
      {
        async createNote() {
          persisted.push("note");
          return null;
        },
        revalidatePath() {},
      }
    );

    assert.deepEqual(noteResult, {
      success: false,
      error: "La nota no puede estar vacia.",
    });
    assert.deepEqual(persisted, []);
  });

  await runTest("workflow surfaces IA failure after legal preparation is complete", async () => {
    const prompts: string[] = [];

    const analysisResult = await analyzeLegalModificationWithDeps(
      "Texto anterior listo para comparar.",
      "Texto nuevo que puede ser cuestionado.",
      "Argentina",
      {
        async generateContent(prompt) {
          prompts.push(prompt);
          throw new Error("provider down");
        },
      }
    );

    assert.equal(prompts.length, 1);
    assert.deepEqual(analysisResult, {
      success: false,
      error: "No se pudo completar el analisis con IA.",
    });
  });

  await runTest("workflow updates case strategy and detaches a linked legal source", async () => {
    const revalidated: string[] = [];
    const updatedCases: Array<Record<string, unknown>> = [];
    const detachedLinks: Array<Record<string, unknown>> = [];

    const clientId = "client-flow-4";
    const caseId = "case-flow-4";
    const legalSourceId = "source-flow-4";

    const editResult = await editCaseWithDeps(
      createFormData({
        id: caseId,
        caratula: "Perez c/ Aseguradora",
        juzgado: "Civil 7",
        status: "IN_PROGRESS",
        code: "CIV-700",
        totalFee: "950000",
        driveLink: "https://drive.test/expediente",
        area: "CIVIL",
        description: "Actualizar estrategia despues de la audiencia preliminar.",
      }),
      {
        async updateCase(id, data) {
          updatedCases.push({ id, ...data });
          return null;
        },
        revalidatePath(path) {
          revalidated.push(path);
        },
      }
    );

    assert.deepEqual(editResult, { success: true });
    assert.deepEqual(updatedCases, [
      {
        id: caseId,
        caratula: "Perez c/ Aseguradora",
        juzgado: "Civil 7",
        status: "IN_PROGRESS",
        code: "CIV-700",
        totalFee: 950000,
        driveLink: "https://drive.test/expediente",
        area: "CIVIL",
        description: "Actualizar estrategia despues de la audiencia preliminar.",
      },
    ]);

    const detachResult = await detachLegalSourceFromCaseWithDeps(
      createFormData({
        caseId,
        clientId,
        legalSourceId,
      }),
      {
        async detach(detachedCaseId, detachedLegalSourceId) {
          detachedLinks.push({ caseId: detachedCaseId, legalSourceId: detachedLegalSourceId });
          return null;
        },
        revalidatePath(path) {
          revalidated.push(path);
        },
      }
    );

    assert.deepEqual(detachResult, { success: true });
    assert.deepEqual(detachedLinks, [{ caseId, legalSourceId }]);
    assert.equal(revalidated.includes("/"), true);
    assert.equal(revalidated.includes(`/client/${clientId}/case/${caseId}`), true);
  });

  await runTest("workflow rejects incomplete case update and invalid source detachment", async () => {
    const touched: string[] = [];

    const editResult = await editCaseWithDeps(
      createFormData({
        id: "",
        caratula: "Caso sin id",
        juzgado: "Civil 1",
        status: "OPEN",
        code: "X-1",
        totalFee: "100",
        driveLink: "",
        area: "CIVIL",
        description: "No deberia actualizar.",
      }),
      {
        async updateCase() {
          touched.push("case");
          return null;
        },
        revalidatePath() {},
      }
    );

    assert.deepEqual(editResult, {
      success: false,
      error: "No se pudo identificar el expediente a actualizar.",
    });

    const detachResult = await detachLegalSourceFromCaseWithDeps(
      createFormData({
        caseId: "",
        clientId: "client-flow-5",
        legalSourceId: "",
      }),
      {
        async detach() {
          touched.push("detach");
          return null;
        },
        revalidatePath() {},
      }
    );

    assert.deepEqual(detachResult, {
      success: false,
      error: "No se pudo desvincular la fuente juridica del expediente.",
    });
    assert.deepEqual(touched, []);
  });
})();
