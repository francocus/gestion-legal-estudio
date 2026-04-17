"use client";

import { useMemo, useState } from "react";
import { Plus, ReceiptText, Save } from "lucide-react";
import { createObligation } from "@/lib/actions/obligations";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClientOption {
  id: string;
  name: string;
}

interface CaseOption {
  id: string;
  clientId: string;
  label: string;
}

interface CreateObligationDialogProps {
  clients: ClientOption[];
  cases: CaseOption[];
}

const CATEGORY_OPTIONS = [
  { value: "TAX", label: "Impuesto" },
  { value: "FEE", label: "Tasa" },
  { value: "CONTRIBUTION", label: "Aporte / carga" },
  { value: "SERVICE", label: "Servicio" },
  { value: "RENT", label: "Alquiler / expensa" },
  { value: "FILING", label: "Presentacion" },
  { value: "OTHER", label: "Otro" },
] as const;

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pendiente" },
  { value: "FILED", label: "Presentado" },
  { value: "PAID", label: "Pagado" },
  { value: "CANCELLED", label: "Anulado" },
] as const;

export function CreateObligationDialog({ clients, cases }: CreateObligationDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [country, setCountry] = useState("Argentina");
  const [status, setStatus] = useState("PENDING");

  const availableCases = useMemo(
    () => cases.filter((item) => item.clientId === selectedClientId),
    [cases, selectedClientId]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await createObligation(formData);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    window.location.reload();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2">
          <Plus className="h-4 w-4" /> Nueva obligacion
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[640px] dark:bg-slate-950 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <ReceiptText className="h-5 w-5 text-blue-500" /> Registrar obligacion
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="dark:text-gray-300">Cliente <span className="text-red-500">*</span></Label>
            <Select name="clientId" value={selectedClientId} onValueChange={setSelectedClientId} required>
              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="dark:text-gray-300">Pais <span className="text-red-500">*</span></Label>
              <Select name="country" value={country} onValueChange={setCountry}>
                <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                  <SelectItem value="Argentina">Argentina</SelectItem>
                  <SelectItem value="Paraguay">Paraguay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="dark:text-gray-300">Expediente asociado</Label>
              <Select name="caseId" disabled={!selectedClientId}>
                <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                  <SelectValue placeholder={selectedClientId ? "Opcional" : "Elegir cliente primero"} />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                  <SelectItem value="NONE">Sin expediente</SelectItem>
                  {availableCases.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="dark:text-gray-300">Organismo <span className="text-red-500">*</span></Label>
              <Input
                name="organism"
                placeholder={country === "Paraguay" ? "Ej: Marangatu / IPS / Municipalidad" : "Ej: AFIP / ARBA / API / Municipalidad"}
                required
                className="dark:bg-slate-900 dark:border-slate-800"
              />
            </div>

            <div className="grid gap-2">
              <Label className="dark:text-gray-300">Categoria <span className="text-red-500">*</span></Label>
              <Select name="category" defaultValue="TAX" required>
                <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="dark:text-gray-300">Concepto <span className="text-red-500">*</span></Label>
            <Input
              name="concept"
              placeholder="Ej: IVA mensual, Ingresos Brutos, Tasa municipal, Presentacion DDJJ"
              required
              className="dark:bg-slate-900 dark:border-slate-800"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label className="dark:text-gray-300">Periodo</Label>
              <Input
                name="period"
                placeholder="Ej: 03/2026"
                className="dark:bg-slate-900 dark:border-slate-800"
              />
            </div>

            <div className="grid gap-2">
              <Label className="dark:text-gray-300">Vencimiento <span className="text-red-500">*</span></Label>
              <Input
                name="dueDate"
                type="date"
                required
                className="dark:bg-slate-900 dark:border-slate-800"
              />
            </div>

            <div className="grid gap-2">
              <Label className="dark:text-gray-300">Monto</Label>
              <Input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="dark:bg-slate-900 dark:border-slate-800"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="dark:text-gray-300">Estado inicial <span className="text-red-500">*</span></Label>
            <Select name="status" value={status} onValueChange={setStatus}>
              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="dark:text-gray-300">Observaciones</Label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Notas, referencia de comprobante, aclaraciones o seguimiento."
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2">
            <Save className="h-4 w-4" /> {loading ? "Guardando..." : "Guardar obligacion"}
          </Button>

          {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
        </form>
      </DialogContent>
    </Dialog>
  );
}
