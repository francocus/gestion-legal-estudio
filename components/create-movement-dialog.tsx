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
import { Textarea } from "@/components/ui/textarea";
import { createMovement } from "@/lib/actions/movements";
import { AlertTriangle } from "lucide-react";

interface Props {
  caseId: string;
  clientId: string;
}

export function CreateMovementDialog({ caseId, clientId }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors">+ Nuevo Movimiento</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] h-[90vh] sm:h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Registrar Movimiento</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <form
            id="movement-form"
            action={async (formData) => {
              setError(null);
              const result = await createMovement(formData);
              if (!result.success) {
                setError(result.error);
                return;
              }
              setOpen(false);
            }}
            className="grid gap-4"
          >
            <input type="hidden" name="caseId" value={caseId} />
            <input type="hidden" name="clientId" value={clientId} />

            <div className="grid gap-2">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" name="date" type="date" defaultValue={today} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Titulo del Movimiento</Label>
              <Input id="title" name="title" placeholder="Ej: Cedula recibida, Despacho simple..." required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Detalle / Texto del Proveido</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Copiar y pegar el texto del juzgado o notas personales..."
                rows={8}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-2 rounded">
                <AlertTriangle className="h-4 w-4" /> {error}
              </div>
            )}
          </form>
        </div>

        <div className="p-6 pt-2 border-t mt-auto bg-gray-50 dark:bg-slate-950 rounded-b-lg">
          <Button type="submit" form="movement-form" className="w-full flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors">
            Guardar Movimiento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
