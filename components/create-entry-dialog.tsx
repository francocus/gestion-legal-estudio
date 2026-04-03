"use client";

import { useMemo, useState } from "react";
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
import { createAccountEntry } from "@/lib/actions/accounting";
import { Plus, Wallet, TrendingUp, TrendingDown, Save } from "lucide-react";

interface AvailableCase {
  id: string;
  clientId: string;
  caratula: string;
  code: string | null;
  clientName: string;
}

interface CreateEntryDialogProps {
  cases?: AvailableCase[];
  defaultCaseId?: string;
  lockCaseSelection?: boolean;
  defaultConcept?: string;
  defaultType?: "INGRESO" | "EGRESO";
  defaultDescription?: string;
  triggerLabel?: string;
  triggerClassName?: string;
  triggerVariant?: "default" | "outline" | "ghost";
  triggerSize?: "default" | "sm" | "lg";
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

export function CreateEntryDialog({
  cases = [],
  defaultCaseId,
  lockCaseSelection = false,
  defaultConcept = "Honorarios",
  defaultType = "INGRESO",
  defaultDescription = "",
  triggerLabel = "Nuevo movimiento",
  triggerClassName = "bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm gap-2",
  triggerVariant = "default",
  triggerSize = "default",
}: CreateEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"INGRESO" | "EGRESO">(defaultType);
  const [selectedCaseId, setSelectedCaseId] = useState(defaultCaseId ?? "GENERAL");

  const selectedCase = useMemo(
    () => cases.find((legalCase) => legalCase.id === selectedCaseId),
    [cases, selectedCaseId]
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const amount = parseFloat((formData.get("amount") as string) || "0");
    const concept = (formData.get("concept") as string) || "Otros";
    const date = (formData.get("date") as string) || new Date().toISOString().split("T")[0];
    const description = (formData.get("description") as string) || "";

    const result = await createAccountEntry({
      date,
      description,
      concept,
      debe: type === "EGRESO" ? amount : 0,
      haber: type === "INGRESO" ? amount : 0,
      caseId: selectedCaseId !== "GENERAL" ? selectedCaseId : undefined,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} className={triggerClassName}>
          <Plus className="h-4 w-4" /> {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px] dark:bg-slate-950 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <Wallet className="h-5 w-5 text-blue-500" /> Registrar movimiento contable
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              className={`flex-1 gap-2 ${type === "INGRESO" ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-500 hover:text-emerald-600"}`}
              onClick={() => setType("INGRESO")}
            >
              <TrendingUp className="h-4 w-4" /> Ingreso
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={`flex-1 gap-2 ${type === "EGRESO" ? "bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm" : "text-slate-500 hover:text-red-600"}`}
              onClick={() => setType("EGRESO")}
            >
              <TrendingDown className="h-4 w-4" /> Egreso
            </Button>
          </div>

          <div className="grid gap-2">
            <Label className="dark:text-gray-300">Descripcion <span className="text-red-500">*</span></Label>
            <Input
              name="description"
              defaultValue={defaultDescription}
              placeholder="Ej: Pago de honorarios Perez"
              required
              className="dark:bg-slate-900 dark:border-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="dark:text-gray-300">Monto ($) <span className="text-red-500">*</span></Label>
              <Input name="amount" type="number" step="0.01" min="0" placeholder="0.00" required className="dark:bg-slate-900 dark:border-slate-800 text-lg font-mono" />
            </div>

            <div className="grid gap-2">
              <Label className="dark:text-gray-300">Fecha <span className="text-red-500">*</span></Label>
              <Input name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required className="dark:bg-slate-900 dark:border-slate-800" />
            </div>
          </div>

          <div className="grid gap-2">
              <Label className="dark:text-gray-300">Rubro <span className="text-red-500">*</span></Label>
            <Select name="concept" defaultValue={defaultConcept} required>
              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                {CONCEPT_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {cases.length > 0 && !lockCaseSelection && (
            <div className="grid gap-2">
              <Label className="dark:text-gray-300">Vincular a expediente</Label>
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
              Se vinculara al expediente de {selectedCase.clientName}: {selectedCase.caratula}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 mt-2 gap-2">
            {loading ? "Guardando..." : <><Save className="h-4 w-4" /> Guardar registro</>}
          </Button>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
