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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEvent } from "@/app/actions";

interface Props {
  caseId: string;
  clientId: string;
}

export function CreateEventDialog({ caseId, clientId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">⏰ Agendar Vencimiento</Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nuevo Evento en Agenda</DialogTitle>
        </DialogHeader>
        
        <form 
          action={async (formData) => {
            await createEvent(formData);
            setOpen(false);
          }} 
          className="grid gap-4 py-4"
        >
          <input type="hidden" name="caseId" value={caseId} />
          <input type="hidden" name="clientId" value={clientId} />

          <div className="grid gap-2">
            <Label>Tipo de Evento</Label>
            <Select name="type" required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEADLINE">⚡ Vencimiento (Plazo Fatal)</SelectItem>
                <SelectItem value="HEARING">⚖️ Audiencia</SelectItem>
                <SelectItem value="MEETING">☕ Reunión</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Fecha y Hora</Label>
            {/* type="datetime-local" permite elegir hora también */}
            <Input id="date" name="date" type="datetime-local" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" placeholder="Ej: Contestación de demanda" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Notas / Qué llevar</Label>
            <Textarea id="description" name="description" placeholder="Detalles importantes..." />
          </div>

          <Button type="submit" className="w-full">Guardar en Agenda</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}