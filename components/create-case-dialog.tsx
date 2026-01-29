"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCase } from "@/app/actions";
import { santaFeCourts } from "@/lib/santa-fe-courts"; // 👈 Importamos la lista nueva

export function CreateCaseDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-black hover:bg-gray-800 text-white font-bold">
          + Nuevo Expediente
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Iniciar Nuevo Expediente</DialogTitle>
        </DialogHeader>
        
        <form 
          action={async (formData) => {
            await createCase(formData);
            setOpen(false);
          }} 
          className="grid gap-4 py-4"
        >
          <input type="hidden" name="clientId" value={clientId} />

          <div className="grid gap-2">
            <Label htmlFor="caratula">Carátula<span className="text-red-500">*</span></Label>
            <Input id="caratula" name="caratula" placeholder="Ej: Perez c/ Gonzalez s/ Daños" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="code">Nº de Expediente<span className="text-red-500">*</span></Label>
            <Input id="code" name="code" placeholder="Ej: 21-12345678-9" required />
          </div>

          {/* 👇 ACÁ ESTÁ EL CAMBIO: SELECTOR DE JUZGADOS */}
          <div className="grid gap-2">
            <Label htmlFor="juzgado">Juzgado / Radicación<span className="text-red-500">*</span></Label>
            <Select name="juzgado" required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar Juzgado..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {santaFeCourts.map((court) => (
                  <SelectItem key={court} value={court}>
                    {court}
                  </SelectItem>
                ))}
                <SelectItem value="OTRO">Otro / Fuera de Lista</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full bg-black hover:bg-gray-800">
            Crear Expediente
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}