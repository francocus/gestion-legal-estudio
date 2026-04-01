"use client";

import { useMemo, useState } from "react";
import { Pencil, Save } from "lucide-react";
import { updateAccountEntry } from "@/lib/actions/accounting";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AvailableCase {
  id: string;
  clientId: string;
  caratula: string;
  code: string | null;
  clientName: string;
}

interface EditEntryDialogProps {
  entry: {
    id: string;
    date: Date;
    description: string;
    concept: string;
    debe: number;
    haber: number;
    caseId?: string | null;
  };
  cases?: AvailableCase[];
  fixedCaseId?: string;
}

const CONCEPT_OPTIONS = [
  "Honorarios",
  "Adelanto de gastos",
  "Tasa judicial",
  "Sueldos / Personal",
  "Gastos bancarios",
  "Creditos / Cobranzas",
  "Cobro de credito",
  "Alquileres / Obras",
  "Impuestos",
  "Otros",
];

export function EditEntryDialog({
  entry,
  cases = [],
  fixedCaseId,
}: EditEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"INGRESO" | "EGRESO">(entry.haber > 0 ? "INGRESO" : "EGRESO");
  const [selectedCaseId, setSelectedCaseId] = useState(
    fixedCaseId ?? entry.caseId ?? "GENERAL"
  );
  const [date, setDate] = useState(new Date(entry.date).toISOString().split("T")[0]);
  const [description, setDescription] = useState(entry.description);
  const [concept, setConcept] = useState(entry.concept);
  const [amount, setAmount] = useState(
    entry.haber > 0 ? entry.haber.toString() : entry.debe.toString()
  );

  const selectedCase = useMemo(
    () => cases.find((legalCase) => legalCase.id === selectedCaseId),
    [cases, selectedCaseId]
  );

  const isCaseLocked = Boolean(fixedCaseId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-600"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] dark:bg-slate-950 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Editar movimiento contable</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              className={`flex-1 ${type === "INGRESO" ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-sm" : "text-slate-500"}`}
              onClick={() => setType("INGRESO")}
            >
              Ingreso
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={`flex-1 ${type === "EGRESO" ? "bg-white dark:bg-slate-800 text-red-600 shadow-sm" : "text-slate-500"}`}
              onClick={() => setType("EGRESO")}
            >
              Egreso
            </Button>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`entry-description-${entry.id}`}>Descripcion</Label>
            <Input
              id={`entry-description-${entry.id}`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="dark:bg-slate-900 dark:border-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`entry-amount-${entry.id}`}>Monto</Label>
              <Input
                id={`entry-amount-${entry.id}`}
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="dark:bg-slate-900 dark:border-slate-800"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`entry-date-${entry.id}`}>Fecha</Label>
              <Input
                id={`entry-date-${entry.id}`}
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="dark:bg-slate-900 dark:border-slate-800"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Rubro</Label>
            <Select value={concept} onValueChange={setConcept}>
              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                {CONCEPT_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {cases.length > 0 && !isCaseLocked && (
            <div className="grid gap-2">
              <Label>Vincular a expediente</Label>
              <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                  <SelectValue placeholder="Seleccionar expediente" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-950 dark:border-slate-800 max-h-[260px]">
                  <SelectItem value="GENERAL">Movimiento general</SelectItem>
                  {cases.map((legalCase) => (
                    <SelectItem key={legalCase.id} value={legalCase.id}>
                      {legalCase.code ? `${legalCase.code} - ` : ""}{legalCase.caratula}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedCase && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
              Vinculado al expediente de {selectedCase.clientName}: {selectedCase.caratula}
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            disabled={loading}
            className="w-full"
            onClick={async () => {
              setLoading(true);
              setError(null);
              const parsedAmount = Number(amount || 0);
              const result = await updateAccountEntry({
                id: entry.id,
                date,
                description,
                concept,
                debe: type === "EGRESO" ? parsedAmount : 0,
                haber: type === "INGRESO" ? parsedAmount : 0,
                caseId: selectedCaseId !== "GENERAL" ? selectedCaseId : undefined,
              });
              setLoading(false);

              if (!result.success) {
                setError(result.error);
                return;
              }

              setOpen(false);
              window.location.reload();
            }}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
