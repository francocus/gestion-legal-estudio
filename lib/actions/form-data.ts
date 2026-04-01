export function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed || trimmed === "EMPTY_SELECTION") return null;

  return trimmed;
}

export function getStringWithDefault(formData: FormData, key: string, fallback: string) {
  return getRequiredString(formData, key) || fallback;
}

export function getOptionalNumber(formData: FormData, key: string) {
  const rawValue = getOptionalString(formData, key);
  if (rawValue === null) return null;

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getOptionalDate(formData: FormData, key: string) {
  const rawValue = getOptionalString(formData, key);
  if (rawValue === null) return null;

  const parsed = new Date(rawValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
