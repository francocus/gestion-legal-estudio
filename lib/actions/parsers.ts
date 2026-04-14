import { AppointmentMode, AppointmentStatus, CaseStatus, EventType } from "@prisma/client";
import { getOptionalNumber, getOptionalString, getRequiredString, getStringWithDefault } from "@/lib/actions/form-data";

function getNullableValue(formData: FormData, key: string) {
  return getOptionalString(formData, key);
}

export function buildClientPayload(formData: FormData) {
  const firstName = getRequiredString(formData, "firstName");
  const lastName = getRequiredString(formData, "lastName");
  const docType = getRequiredString(formData, "docType");
  const dni = getNullableValue(formData, "dni");
  const cuit = getNullableValue(formData, "cuit");
  const gender = getNullableValue(formData, "gender");
  const nationality = getNullableValue(formData, "nationality");
  const birthPlace = getNullableValue(formData, "birthPlace");
  const occupation = getNullableValue(formData, "occupation");
  const civilStatus = getNullableValue(formData, "civilStatus");
  const rawDate = getRequiredString(formData, "birthDate");
  const birthDate = rawDate ? new Date(`${rawDate}T12:00:00`) : null;
  const address = getNullableValue(formData, "address");
  const location = getNullableValue(formData, "location");
  const phone = getNullableValue(formData, "phone");
  const email = getNullableValue(formData, "email");
  const familyPhone = getNullableValue(formData, "familyPhone");

  return {
    firstName,
    lastName,
    docType,
    dni,
    cuit,
    gender,
    birthDate,
    birthPlace,
    nationality,
    occupation,
    civilStatus,
    address,
    location,
    phone,
    email,
    familyPhone,
  };
}

export function parseCreateCaseInput(formData: FormData) {
  const clientId = getRequiredString(formData, "clientId");
  const caratula = getRequiredString(formData, "caratula");
  const description = getRequiredString(formData, "description");
  const area = getStringWithDefault(formData, "area", "CIVIL");
  const isExtrajudicial = getRequiredString(formData, "isExtrajudicial") === "true";

  let code = getRequiredString(formData, "code");
  let juzgado = getRequiredString(formData, "juzgado");

  if (isExtrajudicial) {
    code = "";
    juzgado = "";
  }

  return {
    clientId,
    caratula,
    description,
    area,
    isExtrajudicial,
    code: code || null,
    juzgado: juzgado || null,
  };
}

export function parseEditCaseInput(formData: FormData) {
  return {
    id: getRequiredString(formData, "id"),
    caratula: getRequiredString(formData, "caratula"),
    juzgado: getRequiredString(formData, "juzgado"),
    code: getRequiredString(formData, "code"),
    status: getRequiredString(formData, "status") as CaseStatus,
    totalFee: getOptionalNumber(formData, "totalFee") ?? 0,
    driveLink: getOptionalString(formData, "driveLink"),
    area: getStringWithDefault(formData, "area", "CIVIL"),
    description: getRequiredString(formData, "description"),
  };
}

export function parseCreateTransactionInput(formData: FormData) {
  return {
    caseId: getRequiredString(formData, "caseId"),
    clientId: getRequiredString(formData, "clientId"),
    description: getOptionalString(formData, "description") ?? "",
    amount: getOptionalNumber(formData, "amount"),
    type: getRequiredString(formData, "type"),
  };
}

export function parseCreateAgendaEventInput(formData: FormData) {
  const title = getRequiredString(formData, "title");
  const dateStr = getRequiredString(formData, "date");
  const type = getRequiredString(formData, "type") as EventType;
  const durationRaw = getOptionalString(formData, "durationMinutes");
  const depositRaw = getOptionalString(formData, "depositAmount");

  return {
    title,
    dateStr,
    date: new Date(dateStr),
    type,
    description: getOptionalString(formData, "description") ?? "",
    caseId: getOptionalString(formData, "caseId"),
    clientId: getOptionalString(formData, "clientId"),
    appointmentStatus: (getOptionalString(formData, "appointmentStatus") as AppointmentStatus | null) ?? (type === "APPOINTMENT" ? "PENDING" : null),
    appointmentMode: getOptionalString(formData, "appointmentMode") as AppointmentMode | null,
    durationMinutes: durationRaw ? Number(durationRaw) : null,
    depositAmount: depositRaw ? Number(depositRaw) : null,
    depositPaid: getOptionalString(formData, "depositPaid") === "true",
  };
}
