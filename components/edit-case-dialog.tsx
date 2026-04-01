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
import { CaseStatus } from "@prisma/client";
import { editCase } from "@/lib/actions/cases";
import {
  AlertTriangle,
  Briefcase,
  DollarSign,
  FileText,
  Gavel,
  HeartHandshake,
  Link as LinkIcon,
  Pencil,
  Save,
  ShieldAlert,
  StickyNote,
  Users,
} from "lucide-react";

export function EditCaseDialog({
  legalCase,
}: {
  legalCase: {
    id: string;
    caratula: string;
    code: string | null;
    juzgado: string | null;
    totalFee: number | null;
    status: CaseStatus;
    driveLink: string | null;
    area: string;
    description: string | null;
    isExtrajudicial: boolean;
  };
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monto, setMonto] = useState(legalCase.totalFee || 0);

  const judicialAreas = [
    { value: "CIVIL", label: "Civil y Comercial", icon: Gavel },
    { value: "FAMILIA", label: "Familia", icon: Users },
    { value: "LABORAL", label: "Laboral", icon: Briefcase },
    { value: "PENAL", label: "Penal", icon: ShieldAlert },
    { value: "PREVISIONAL", label: "Previsional", icon: HeartHandshake },
    { value: "ADMINISTRATIVO", label: "Administrativo", icon: FileText },
  ];

  const extrajudicialAreas = [
    { value: "INMOBILIARIO", label: "Inmobiliario", icon: FileText },
    { value: "COBRANZAS", label: "Cobranzas y creditos", icon: DollarSign },
    { value: "TRIBUTARIO", label: "Impuestos y Tributacion", icon: FileText },
    { value: "RRHH", label: "Sueldos y Despidos", icon: Briefcase },
    { value: "ACUERDOS", label: "Acuerdos", icon: FileText },
  ];

  const areaOptions = legalCase.isExtrajudicial ? extrajudicialAreas : judicialAreas;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("id", legalCase.id);
    formData.set("totalFee", monto.toString());

    const result = await editCase(formData);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-gray-300 text-gray-700 hover:bg-gray-100 dark:bg-slate-900 dark:border-slate-800 dark:text-gray-300 dark:hover:bg-slate-800 shadow-sm transition-all"
        >
          <Pencil className="h-3.5 w-3.5" /> Editar Datos
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] dark:bg-slate-950 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Editar Expediente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="caratula" className="dark:text-gray-300">Caratula</Label>
            <Input id="caratula" name="caratula" defaultValue={legalCase.caratula} required className="dark:bg-slate-900 dark:border-slate-800" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code" className="dark:text-gray-300">
                {legalCase.isExtrajudicial ? "Referencia interna" : "Nro. de expediente"}
              </Label>
              <Input id="code" name="code" defaultValue={legalCase.code || ""} className="dark:bg-slate-900 dark:border-slate-800" />
            </div>

            <div className="grid gap-2 min-w-0">
              <Label htmlFor="juzgado" className="dark:text-gray-300">
                {legalCase.isExtrajudicial ? "Organismo / contraparte / referencia" : "Organismo / tribunal"}
              </Label>
              <Input
                id="juzgado"
                name="juzgado"
                defaultValue={legalCase.juzgado || ""}
                placeholder={legalCase.isExtrajudicial ? "Ej: Acuerdo privado, mediacion, contraparte..." : "Ej: Tribunal Laboral Nro. 2"}
                className="dark:bg-slate-900 dark:border-slate-800"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="totalFee" className="dark:text-gray-300 flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-3 w-3" /> Honorarios / monto estimado
            </Label>
            <div className="relative">
              <Input
                id="totalFee"
                name="totalFee"
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value ? parseFloat(e.target.value) : 0)}
                className="dark:bg-slate-900 dark:border-slate-800 font-bold text-emerald-600 dark:text-emerald-400 pl-6"
              />
              <span className="absolute left-2.5 top-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">$</span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status" className="dark:text-gray-300">Estado</Label>
            <Select name="status" defaultValue={legalCase.status}>
              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                <SelectItem value="ACTIVE">En Tramite</SelectItem>
                <SelectItem value="MEDIATION">Mediacion</SelectItem>
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
            <Label htmlFor="area" className="dark:text-gray-300">
              {legalCase.isExtrajudicial ? "Materia / tipo de gestion" : "Fuero / materia"}
            </Label>
            <Select name="area" defaultValue={legalCase.area || "CIVIL"}>
              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                <SelectValue placeholder="Seleccionar materia" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                {areaOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" /> {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
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
              placeholder="Escribi aca notas importantes, recordatorios o resumen del caso..."
              className="dark:bg-slate-900 dark:border-slate-800 min-h-[100px]"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 transition-all shadow-md shadow-blue-900/20 mt-2 gap-2"
          >
            {loading ? "Guardando..." : (
              <>
                <Save className="h-4 w-4" /> Guardar Cambios
              </>
            )}
          </Button>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-2 rounded">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
