"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCaseFee } from "@/lib/actions/cases";
import { CreateEntryDialog } from "@/components/create-entry-dialog";
import { Pencil, ReceiptText } from "lucide-react";

interface HonorariosActionsProps {
  caseId: string;
  clientId: string;
  caratula: string;
  clientName: string;
  totalFee: number;
}

export function HonorariosActions({
  caseId,
  clientId,
  caratula,
  clientName,
  totalFee,
}: HonorariosActionsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState(totalFee.toString());

  return (
    <div className="flex flex-col gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="justify-start text-xs">
            <Pencil className="h-3 w-3 mr-1" /> Editar pactado
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[420px] dark:bg-slate-950 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <ReceiptText className="h-4 w-4 text-indigo-500" /> Actualizar honorarios pactados
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <p className="font-medium">{caratula}</p>
              <p className="text-xs mt-1">{clientName}</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`fee-${caseId}`}>Monto pactado</Label>
              <Input
                id={`fee-${caseId}`}
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="dark:bg-slate-900 dark:border-slate-800"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              className="w-full"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setError(null);
                const result = await updateCaseFee(caseId, clientId, Number(amount || 0));
                setLoading(false);
                if (!result.success) {
                  setError(result.error);
                  return;
                }
                setOpen(false);
                window.location.reload();
              }}
            >
              {loading ? "Guardando..." : "Guardar honorarios pactados"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CreateEntryDialog
        cases={[{ id: caseId, clientId, caratula, code: null, clientName }]}
        defaultCaseId={caseId}
        lockCaseSelection={true}
        defaultConcept="Honorarios"
        defaultType="INGRESO"
        defaultDescription={`Cobro de honorarios - ${caratula}`}
        triggerLabel="Registrar cobro"
        triggerVariant="outline"
        triggerSize="sm"
        triggerClassName="justify-start text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
      />

      <CreateEntryDialog
        cases={[{ id: caseId, clientId, caratula, code: null, clientName }]}
        defaultCaseId={caseId}
        lockCaseSelection={true}
        defaultConcept="Honorarios"
        defaultType="EGRESO"
        defaultDescription={`Gasto vinculado a honorarios - ${caratula}`}
        triggerLabel="Registrar gasto"
        triggerVariant="outline"
        triggerSize="sm"
        triggerClassName="justify-start text-xs border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-950/30"
      />
    </div>
  );
}
