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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    formData.append("caseId", caseId);
    formData.append("clientId", clientId);
    
    await createEvent(formData);
    
    setLoading(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* 🔵 ACCIÓN CREAR: AZUL (Antes era rojo/destructive) */}
        <Button variant="destructive">
            ⏰ Agendar Vencimiento
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px] dark:bg-slate-950 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Nuevo Evento en Agenda</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          <div className="grid gap-2">
            <Label className="dark:text-gray-300">Tipo de Evento</Label>
            <Select name="type" required defaultValue="DEADLINE">
              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                <SelectItem value="DEADLINE">⚡ Vencimiento (Plazo Fatal)</SelectItem>
                <SelectItem value="HEARING">⚖️ Audiencia</SelectItem>
                <SelectItem value="MEETING">☕ Reunión</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title" className="dark:text-gray-300">Título</Label>
            <Input id="title" name="title" placeholder="Ej: Contestación de demanda" required className="dark:bg-slate-900 dark:border-slate-800" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date" className="dark:text-gray-300">Fecha y Hora</Label>
            <Input id="date" name="date" type="datetime-local" required className="dark:bg-slate-900 dark:border-slate-800 block w-full" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" className="dark:text-gray-300">Notas / Qué llevar</Label>
            <Textarea id="description" name="description" placeholder="Detalles importantes..." className="dark:bg-slate-900 dark:border-slate-800 min-h-[100px]" />
          </div>

          {/* 🔵 BOTÓN GUARDAR: AZUL */}
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold mt-2"
          >
            {loading ? "Guardando..." : "Guardar en Agenda"}
          </Button>

        </form>
      </DialogContent>
    </Dialog>
  );
}