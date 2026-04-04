import assert from "node:assert/strict";
import { getOptionalDate, getOptionalNumber, getOptionalString, getRequiredString, getStringWithDefault } from "@/lib/actions/form-data";
import { buildClientPayload, parseCreateAgendaEventInput, parseCreateCaseInput, parseCreateTransactionInput, parseEditCaseInput } from "@/lib/actions/parsers";

function createFormData(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest("buildClientPayload normalizes optional empty fields", () => {
  const formData = createFormData({
    firstName: "  Ana  ",
    lastName: "  Perez ",
    docType: "DNI",
    dni: "",
    gender: "EMPTY_SELECTION",
    birthDate: "1990-04-15",
    phone: " 3415551234 ",
  });

  const payload = buildClientPayload(formData);

  assert.equal(payload.firstName, "Ana");
  assert.equal(payload.lastName, "Perez");
  assert.equal(payload.dni, null);
  assert.equal(payload.gender, null);
  assert.equal(payload.phone, "3415551234");
  assert.equal(payload.birthDate?.toISOString().slice(0, 10), "1990-04-15");
});

runTest("parseCreateCaseInput clears court data for extrajudicial cases", () => {
  const formData = createFormData({
    clientId: "client-1",
    caratula: "Cobranza administrativa",
    description: "Gestión extrajudicial",
    area: "COBRANZAS",
    isExtrajudicial: "true",
    code: "EXP-123",
    juzgado: "Juzgado Civil 1",
  });

  const payload = parseCreateCaseInput(formData);

  assert.equal(payload.clientId, "client-1");
  assert.equal(payload.isExtrajudicial, true);
  assert.equal(payload.code, null);
  assert.equal(payload.juzgado, null);
});

runTest("parseCreateTransactionInput rejects empty numeric payloads by returning null amount", () => {
  const formData = createFormData({
    caseId: "case-1",
    clientId: "client-1",
    description: "  Bono ley  ",
    amount: "abc",
    type: "EXPENSE",
  });

  const payload = parseCreateTransactionInput(formData);

  assert.equal(payload.caseId, "case-1");
  assert.equal(payload.clientId, "client-1");
  assert.equal(payload.description, "Bono ley");
  assert.equal(payload.amount, null);
  assert.equal(payload.type, "EXPENSE");
});

runTest("parseCreateAgendaEventInput keeps valid optional case linkage and date", () => {
  const formData = createFormData({
    title: " Audiencia preliminar ",
    date: "2026-04-03",
    type: "HEARING",
    description: " Sala 2 ",
    caseId: "case-55",
  });

  const payload = parseCreateAgendaEventInput(formData);

  assert.equal(payload.title, "Audiencia preliminar");
  assert.equal(payload.type, "HEARING");
  assert.equal(payload.description, "Sala 2");
  assert.equal(payload.caseId, "case-55");
  assert.equal(payload.date.toISOString(), "2026-04-03T00:00:00.000Z");
});

runTest("parseEditCaseInput normalizes blank link and invalid fee to safe defaults", () => {
  const formData = createFormData({
    id: "case-9",
    caratula: " Perez c/ Gomez ",
    juzgado: "Juzgado Laboral 2",
    code: "21-99999999-1",
    status: "ACTIVE",
    totalFee: "no-es-numero",
    driveLink: "   ",
    area: "",
    description: " Demanda laboral ",
  });

  const payload = parseEditCaseInput(formData);

  assert.equal(payload.id, "case-9");
  assert.equal(payload.caratula, "Perez c/ Gomez");
  assert.equal(payload.totalFee, 0);
  assert.equal(payload.driveLink, null);
  assert.equal(payload.area, "CIVIL");
  assert.equal(payload.description, "Demanda laboral");
});

runTest("parseCreateCaseInput falls back to CIVIL area when omitted", () => {
  const formData = createFormData({
    clientId: "client-2",
    caratula: "Sucesión",
    description: "Inicio",
    area: "",
    isExtrajudicial: "false",
    code: "EXP-77",
    juzgado: "Juzgado Civil 3",
  });

  const payload = parseCreateCaseInput(formData);

  assert.equal(payload.area, "CIVIL");
  assert.equal(payload.code, "EXP-77");
  assert.equal(payload.juzgado, "Juzgado Civil 3");
});

runTest("form-data helpers normalize strings, numbers and dates", () => {
  const formData = createFormData({
    required: "  valor  ",
    optional: " EMPTY_SELECTION ",
    numberValid: " 1500.50 ",
    numberInvalid: "abc",
    dateValid: "2026-05-01",
    dateInvalid: "no-date",
    blank: "   ",
  });

  assert.equal(getRequiredString(formData, "required"), "valor");
  assert.equal(getOptionalString(formData, "blank"), null);
  assert.equal(getOptionalString(formData, "optional"), null);
  assert.equal(getStringWithDefault(formData, "blank", "fallback"), "fallback");
  assert.equal(getOptionalNumber(formData, "numberValid"), 1500.5);
  assert.equal(getOptionalNumber(formData, "numberInvalid"), null);
  assert.equal(getOptionalDate(formData, "dateValid")?.toISOString(), "2026-05-01T00:00:00.000Z");
  assert.equal(getOptionalDate(formData, "dateInvalid"), null);
});

runTest("parseCreateAgendaEventInput keeps invalid dates detectable for action guards", () => {
  const formData = createFormData({
    title: "Vencimiento",
    date: "fecha-invalida",
    type: "DEADLINE",
    description: "",
  });

  const payload = parseCreateAgendaEventInput(formData);

  assert.equal(Number.isNaN(payload.date.getTime()), true);
  assert.equal(payload.caseId, null);
});
