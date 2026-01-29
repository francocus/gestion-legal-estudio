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
import { createMovement } from "@/app/actions";

interface Props {
  caseId: string;
  clientId: string;
}

export function CreateMovementDialog({ caseId, clientId }: Props) {
  const [open, setOpen] = useState(false);

  // Fecha de hoy por defecto para el input (formato YYYY-MM-DD)
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Nuevo Movimiento</Button>
      </DialogTrigger>
      
      {/* Diseño de "Pantalla Partida" para que el botón nunca se esconda */}
      <DialogContent className="sm:max-w-[500px] h-[90vh] sm:h-[80vh] flex flex-col p-0 gap-0">
        
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Registrar Movimiento</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 pt-2">
            <form 
              id="movement-form"
              action={async (formData) => {
                await createMovement(formData);
                setOpen(false);
              }} 
              className="grid gap-4"
            >
              <input type="hidden" name="caseId" value={caseId} />
              <input type="hidden" name="clientId" value={clientId} />

              <div className="grid gap-2">
                <Label htmlFor="date">Fecha</Label>
                <Input 
                    id="date" 
                    name="date" 
                    type="date" 
                    defaultValue={today} 
                    required 
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="title">Título del Movimiento</Label>
                <Input id="title" name="title" placeholder="Ej: Cédula recibida, Despacho simple..." required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Detalle / Texto del Proveído</Label>
                <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Copiar y pegar el texto del juzgado o notas personales..." 
                    rows={8} 
                />
              </div>
            </form>
        </div>

        <div className="p-6 pt-2 border-t mt-auto bg-gray-50 rounded-b-lg">
             <Button type="submit" form="movement-form" className="w-full">
                Guardar Movimiento
             </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}