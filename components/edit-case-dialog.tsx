"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateCase } from "@/app/actions";
import { santaFeCourts } from "@/lib/santa-fe-courts"; // 👈 Importamos la lista

interface Props {
  legalCase: {
    id: string;
    caratula: string;
    juzgado: string;
    status: string;
    clientId: string;
    code: string;
  };
}

export function EditCaseDialog({ legalCase }: Props) {
  const [open, setOpen] = useState(false);

  // Verificamos si el juzgado actual está en la lista. Si no está, asumimos que es "OTRO" o un texto libre viejo.
  const isKnownCourt = santaFeCourts.includes(legalCase.juzgado);
  const defaultValue = isKnownCourt ? legalCase.juzgado : undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto">
          ✏️ Editar Datos
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Expediente</DialogTitle>
        </DialogHeader>
        
        <form 
          action={async (formData) => {
            await updateCase(formData);
            setOpen(false);
          }} 
          className="grid gap-4 py-4"
        >
          <input type="hidden" name="id" value={legalCase.id} />
          <input type="hidden" name="clientId" value={legalCase.clientId} />

          <div className="grid gap-2">
            <Label htmlFor="caratula">Carátula<span className="text-red-500">*</span></Label>
            <Input id="caratula" name="caratula" defaultValue={legalCase.caratula} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="code">Nº de Expediente<span className="text-red-500">*</span></Label>
            <Input id="code" name="code" defaultValue={legalCase.code} required />
          </div>

          {/* 👇 SELECTOR DE JUZGADOS AL EDITAR */}
          <div className="grid gap-2">
            <Label htmlFor="juzgado">Juzgado<span className="text-red-500">*</span></Label>
            <Select name="juzgado" defaultValue={defaultValue}>
              <SelectTrigger>
                <SelectValue placeholder={legalCase.juzgado} /> 
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {santaFeCourts.map((court) => (
                  <SelectItem key={court} value={court}>
                    {court}
                  </SelectItem>
                ))}
                <SelectItem value="OTRO">Otro</SelectItem>
              </SelectContent>
            </Select>
            {/* Si el juzgado viejo no estaba en la lista, mostramos un aviso chiquito */}
            {!isKnownCourt && (
                <p className="text-xs text-orange-600 mt-1">
                    * El juzgado actual ("{legalCase.juzgado}") no está en la lista estándar. Elegí uno nuevo para corregirlo.
                </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Estado del Juicio<span className="text-red-500">*</span></Label>
            <Select name="status" defaultValue={legalCase.status}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">🟢 En Trámite</SelectItem>
                <SelectItem value="MEDIATION">🤝 Mediación</SelectItem>
                <SelectItem value="ARCHIVED">📂 Terminado / Archivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white">
            Guardar Cambios
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}