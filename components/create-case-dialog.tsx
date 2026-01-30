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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCase } from "@/app/actions";
import { santaFeCourts } from "@/lib/santa-fe-courts";

export function CreateCaseDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Usamos handleSubmit para controlar el loading y cerrar el modal
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    formData.append("clientId", clientId); // Agregamos el ID oculto

    await createCase(formData);
    
    setLoading(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* 🔵 ACCIÓN PRINCIPAL: AZUL */}
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition-all">
          + Nuevo Expediente
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px] dark:bg-slate-950 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Iniciar Nuevo Expediente</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          <div className="grid gap-2">
            <Label htmlFor="caratula" className="dark:text-gray-300">
                Carátula <span className="text-red-500">*</span>
            </Label>
            <Input id="caratula" name="caratula" placeholder="Ej: Perez c/ Gonzalez s/ Daños" required className="dark:bg-slate-900 dark:border-slate-800"/>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="code" className="dark:text-gray-300">
                Nº de Expediente <span className="text-red-500">*</span>
            </Label>
            <Input id="code" name="code" placeholder="Ej: 21-12345678-9" required className="dark:bg-slate-900 dark:border-slate-800"/>
          </div>

          {/* SELECTOR DE JUZGADOS */}
          <div className="grid gap-2">
            <Label htmlFor="juzgado" className="dark:text-gray-300">
                Juzgado / Radicación <span className="text-red-500">*</span>
            </Label>
            <Select name="juzgado" required>
              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                <SelectValue placeholder="Seleccionar Juzgado..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] dark:bg-slate-950 dark:border-slate-800">
                {santaFeCourts.map((court) => (
                  <SelectItem key={court} value={court}>
                    {court}
                  </SelectItem>
                ))}
                <SelectItem value="OTRO">Otro / Fuera de Lista</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* SELECCIÓN DE FUERO */}
          <div className="grid gap-2">
            <Label htmlFor="area" className="dark:text-gray-300">Fuero / Materia</Label>
            <Select name="area" defaultValue="CIVIL">
              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                <SelectValue placeholder="Seleccionar fuero" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                <SelectItem value="CIVIL">🏛️ Civil y Comercial</SelectItem>
                <SelectItem value="FAMILIA">👨‍👩‍👧 Familia</SelectItem>
                <SelectItem value="LABORAL">👷 Laboral</SelectItem>
                <SelectItem value="PENAL">⚖️ Penal</SelectItem>
                <SelectItem value="PREVISIONAL">👴 Previsional</SelectItem>
                <SelectItem value="ADMINISTRATIVO">📄 Administrativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Descripción (Opcional) */}
          <div className="grid gap-2">
             <Label htmlFor="description" className="dark:text-gray-300">Notas Adicionales</Label>
             <Input id="description" name="description" placeholder="Detalles extra..." className="dark:bg-slate-900 dark:border-slate-800"/>
          </div>

          {/* 🔵 BOTÓN GUARDAR: AZUL */}
          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 mt-2"
          >
            {loading ? "Creando..." : "Crear Expediente"}
          </Button>

        </form>
      </DialogContent>
    </Dialog>
  );
}