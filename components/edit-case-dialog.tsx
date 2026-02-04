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
import { santaFeCourts } from "@/lib/santa-fe-courts";

// 👇 IMPORTACIÓN DE ICONOS
import { 
  Pencil, 
  DollarSign, 
  Link as LinkIcon, 
  StickyNote,
  Gavel,
  Users,
  Briefcase,
  ShieldAlert,
  HeartHandshake,
  FileText
} from "lucide-react";

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
        {/* ⚪ ACCIÓN SECUNDARIA: OUTLINE CON ICONO LÁPIZ */}
        <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 border-gray-300 text-gray-700 hover:bg-gray-100 dark:bg-slate-900 dark:border-slate-800 dark:text-gray-300 dark:hover:bg-slate-800 shadow-sm transition-all"
        >
          <Pencil className="h-3.5 w-3.5" /> Editar Datos
        </Button>
      </DialogTrigger>
      
      {/* 👇 ACÁ ESTÁ EL CAMBIO: sm:max-w-[600px] (Antes era 425px) */}
      <DialogContent className="sm:max-w-[600px] dark:bg-slate-950 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
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
                <Select name="juzgado" defaultValue={legalCase.juzgado}>
                  <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800 w-full">
                    <SelectValue placeholder="Seleccionar Juzgado" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-950 dark:border-slate-800 max-h-[300px]">
                    {santaFeCourts.map((court) => (
                      <SelectItem key={court} value={court}>
                        {court}
                      </SelectItem>
                    ))}
                    <SelectItem value="OTRO">Otro / Fuera de Lista</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="totalFee" className="dark:text-gray-300 font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                <DollarSign className="h-4 w-4" /> Honorarios Totales
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
            <Label htmlFor="driveLink" className="dark:text-gray-300 flex items-center gap-1">
                <LinkIcon className="h-4 w-4 text-blue-500" /> Link Expediente
            </Label>
            <Input id="driveLink" name="driveLink" defaultValue={legalCase.driveLink || ""} className="dark:bg-slate-900 dark:border-slate-800 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="area" className="dark:text-gray-300">Fuero / Materia</Label>
            <Select name="area" defaultValue={legalCase.area || "CIVIL"}>
              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                <SelectValue placeholder="Fuero" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                <SelectItem value="CIVIL">
                    <div className="flex items-center gap-2"><Gavel className="h-3.5 w-3.5" /> Civil y Comercial</div>
                </SelectItem>
                <SelectItem value="FAMILIA">
                    <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Familia</div>
                </SelectItem>
                <SelectItem value="LABORAL">
                    <div className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> Laboral</div>
                </SelectItem>
                <SelectItem value="PENAL">
                    <div className="flex items-center gap-2"><ShieldAlert className="h-3.5 w-3.5" /> Penal</div>
                </SelectItem>
                <SelectItem value="PREVISIONAL">
                    <div className="flex items-center gap-2"><HeartHandshake className="h-3.5 w-3.5" /> Previsional</div>
                </SelectItem>
                <SelectItem value="ADMINISTRATIVO">
                    <div className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Administrativo</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" className="dark:text-gray-300 font-bold flex items-center gap-1">
                <StickyNote className="h-4 w-4 text-amber-500" /> Notas del Caso
            </Label>
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