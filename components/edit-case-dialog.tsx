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
import { editCase } from "@/app/actions"; 

export function EditCaseDialog({ legalCase }: { legalCase: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append("id", legalCase.id); 

    await editCase(formData);
    setLoading(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* ⚪ ACCIÓN SECUNDARIA: OUTLINE (Gris en claro / Slate en oscuro) */}
        <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 border-gray-300 text-gray-700 hover:bg-gray-100 dark:bg-slate-900 dark:border-slate-800 dark:text-gray-300 dark:hover:bg-slate-800 shadow-sm transition-all"
        >
          ✏️ Editar Datos
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px] dark:bg-slate-950 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Editar Expediente</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          <div className="grid gap-2">
            <Label htmlFor="caratula" className="dark:text-gray-300">Carátula</Label>
            <Input id="caratula" name="caratula" defaultValue={legalCase.caratula} required className="dark:bg-slate-900 dark:border-slate-800" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="code" className="dark:text-gray-300">Nº Expediente</Label>
                <Input id="code" name="code" defaultValue={legalCase.code} required className="dark:bg-slate-900 dark:border-slate-800" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="juzgado" className="dark:text-gray-300">Juzgado</Label>
                <Input id="juzgado" name="juzgado" defaultValue={legalCase.juzgado} required className="dark:bg-slate-900 dark:border-slate-800" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="totalFee" className="dark:text-gray-300 font-bold text-green-600 dark:text-green-400">
                💰 Honorarios Totales
            </Label>
            <Input id="totalFee" name="totalFee" type="number" defaultValue={legalCase.totalFee || 0} className="dark:bg-slate-900 dark:border-slate-800 font-bold" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status" className="dark:text-gray-300">Estado</Label>
            <Select name="status" defaultValue={legalCase.status}>
              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                <SelectItem value="ACTIVE">En Trámite</SelectItem>
                <SelectItem value="MEDIATION">Mediación</SelectItem>
                <SelectItem value="ARCHIVED">Archivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="driveLink" className="dark:text-gray-300">☁️ Link Expediente</Label>
            <Input id="driveLink" name="driveLink" defaultValue={legalCase.driveLink || ""} className="dark:bg-slate-900 dark:border-slate-800 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="area" className="dark:text-gray-300">Fuero / Materia</Label>
            <Select name="area" defaultValue={legalCase.area || "CIVIL"}>
              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                <SelectValue placeholder="Fuero" />
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

          <div className="grid gap-2">
            <Label htmlFor="description" className="dark:text-gray-300 font-bold">📝 Notas del Caso</Label>
            <Textarea 
                id="description" 
                name="description" 
                defaultValue={legalCase.description || ""} 
                placeholder="Escribí acá notas importantes, recordatorios o resumen del caso..."
                className="dark:bg-slate-900 dark:border-slate-800 min-h-[100px]" 
            />
          </div>

          {/* 🔵 BOTÓN GUARDAR: AZUL INSTITUCIONAL */}
          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 transition-all shadow-md shadow-blue-900/20 mt-2"
          >
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}