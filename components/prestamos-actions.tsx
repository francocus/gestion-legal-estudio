"use client";

import { CreateEntryDialog } from "@/components/create-entry-dialog";

interface PrestamosActionsProps {
  caseId: string;
  clientId: string;
  caratula: string;
  clientName: string;
}

export function PrestamosActions({
  caseId,
  clientId,
  caratula,
  clientName,
}: PrestamosActionsProps) {
  const caseOption = [{ id: caseId, clientId, caratula, code: null, clientName }];

  return (
    <div className="flex flex-col gap-2">
      <CreateEntryDialog
        cases={caseOption}
        defaultCaseId={caseId}
        lockCaseSelection={true}
        defaultConcept="Creditos / Cobranzas"
        defaultType="EGRESO"
        defaultDescription={`Entrega de fondos - ${caratula}`}
        triggerLabel="Registrar entrega"
        triggerVariant="outline"
        triggerSize="sm"
        triggerClassName="justify-start text-xs border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-950/30"
      />

      <CreateEntryDialog
        cases={caseOption}
        defaultCaseId={caseId}
        lockCaseSelection={true}
        defaultConcept="Cobro de credito"
        defaultType="INGRESO"
        defaultDescription={`Cobro de credito - ${caratula}`}
        triggerLabel="Registrar cobro"
        triggerVariant="outline"
        triggerSize="sm"
        triggerClassName="justify-start text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
      />
    </div>
  );
}
