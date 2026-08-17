export type AccountingCategory = "TODOS" | "HONORARIOS" | "ALQUILERES_OBRAS" | "PRESTAMOS";

export function normalizeConcept(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

export function matchesCategory(concept: string, category: AccountingCategory) {
  const normalized = normalizeConcept(concept);

  if (category === "TODOS") return true;
  if (category === "HONORARIOS") return normalized.includes("HONORARIO");
  if (category === "ALQUILERES_OBRAS") {
    return (
      normalized.includes("ALQUILER") ||
      normalized.includes("OBRA") ||
      normalized.includes("EXPENSA") ||
      normalized.includes("INMOBILI")
    );
  }
  if (category === "PRESTAMOS") {
    return (
      normalized.includes("PRESTAMO") ||
      normalized.includes("MUTUO") ||
      normalized.includes("CREDITO") ||
      normalized.includes("COBRANZA")
    );
  }

  return true;
}
