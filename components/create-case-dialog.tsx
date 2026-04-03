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
import { createCase } from "@/lib/actions/cases";
import {
  AlertTriangle,
  Briefcase,
  Building2,
  Calculator,
  FileText,
  FolderPlus,
  Gavel,
  HeartHandshake,
  Landmark,
  Receipt,
  Save,
  ShieldAlert,
  Users,
} from "lucide-react";

export function CreateCaseDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExtrajudicial, setIsExtrajudicial] = useState(false);
  const [area, setArea] = useState("CIVIL");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("clientId", clientId);

    if (isExtrajudicial) {
      formData.append("isExtrajudicial", "true");
      formData.append("code", "");
      formData.append("juzgado", "");
    } else {
      formData.append("isExtrajudicial", "false");
    }

    const result = await createCase(formData);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    setIsExtrajudicial(false);
    setArea("CIVIL");
  };

  const handleToggleExtrajudicial = (checked: boolean) => {
    setIsExtrajudicial(checked);
    setArea(checked ? "INMOBILIARIO" : "CIVIL");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition-all gap-2">
          <FolderPlus className="h-4 w-4" /> Nuevo Expediente / Carpeta
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] dark:bg-slate-950 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white flex items-center gap-2">
            {isExtrajudicial ? (
              <><Building2 className="h-5 w-5 text-indigo-500" /> Nueva Gestion Extrajudicial</>
            ) : (
              <><Gavel className="h-5 w-5 text-blue-500" /> Iniciar Nuevo Expediente Judicial</>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <div>
              <Label className="text-sm font-bold dark:text-gray-300">Tramite Extrajudicial</Label>
              <p className="text-[10px] text-slate-500">Acuerdos, cobranzas, inmuebles y otras gestiones sin tribunal</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isExtrajudicial}
                onChange={(e) => handleToggleExtrajudicial(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600" />
            </label>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="caratula" className="dark:text-gray-300">
              {isExtrajudicial ? "Nombre de la gestion" : "Caratula"} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="caratula"
              name="caratula"
              placeholder={isExtrajudicial ? "Ej: Acuerdo de pago - Perez" : "Ej: Perez c/ Gonzalez s/ Danos"}
              required
              className="dark:bg-slate-900 dark:border-slate-800"
            />
          </div>

          {!isExtrajudicial && (
            <>
              <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <Label htmlFor="code" className="dark:text-gray-300">
                  N de Expediente <span className="text-red-500">*</span>
                </Label>
                <Input id="code" name="code" placeholder="Ej: 21-12345678-9" required className="dark:bg-slate-900 dark:border-slate-800" />
              </div>

              <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <Label htmlFor="juzgado" className="dark:text-gray-300">
                  Organismo / Tribunal / Referencia
                </Label>
                <Input
                  id="juzgado"
                  name="juzgado"
                  placeholder="Ej: Tribunal Laboral Nro. 2, Centro de Mediacion, Camara Civil..."
                  className="dark:bg-slate-900 dark:border-slate-800"
                />
              </div>
            </>
          )}

          <div className="grid gap-2 animate-in fade-in">
            <Label htmlFor="area" className="dark:text-gray-300">
              {isExtrajudicial ? "Tipo de gestion" : "Fuero / Materia"} <span className="text-red-500">*</span>
            </Label>

            <Select name="area" value={area} onValueChange={setArea} required>
              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                {isExtrajudicial ? (
                  <>
                    <SelectItem value="INMOBILIARIO"><div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> Inmobiliario</div></SelectItem>
                    <SelectItem value="COBRANZAS"><div className="flex items-center gap-2"><Landmark className="h-3.5 w-3.5" /> Cobranzas y creditos</div></SelectItem>
                    <SelectItem value="TRIBUTARIO"><div className="flex items-center gap-2"><Calculator className="h-3.5 w-3.5" /> Impuestos y Tributacion</div></SelectItem>
                    <SelectItem value="RRHH"><div className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> Sueldos y Despidos</div></SelectItem>
                    <SelectItem value="ACUERDOS"><div className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Acuerdos</div></SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="CIVIL"><div className="flex items-center gap-2"><Gavel className="h-3.5 w-3.5" /> Civil y Comercial</div></SelectItem>
                    <SelectItem value="FAMILIA"><div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Familia</div></SelectItem>
                    <SelectItem value="LABORAL"><div className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> Laboral</div></SelectItem>
                    <SelectItem value="PENAL"><div className="flex items-center gap-2"><ShieldAlert className="h-3.5 w-3.5" /> Penal</div></SelectItem>
                    <SelectItem value="PREVISIONAL"><div className="flex items-center gap-2"><HeartHandshake className="h-3.5 w-3.5" /> Previsional</div></SelectItem>
                    <SelectItem value="ADMINISTRATIVO"><div className="flex items-center gap-2"><Receipt className="h-3.5 w-3.5" /> Administrativo (Estado)</div></SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" className="dark:text-gray-300">Notas Adicionales</Label>
            <Input id="description" name="description" placeholder="Detalles extra..." className="dark:bg-slate-900 dark:border-slate-800" />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-bold py-2 mt-2 gap-2 transition-colors ${isExtrajudicial ? "bg-indigo-600 hover:bg-indigo-700" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {loading ? "Creando..." : (
              <>
                <Save className="h-4 w-4" /> {isExtrajudicial ? "Crear gestion" : "Crear expediente"}
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
