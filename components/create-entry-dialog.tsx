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
import { createAccountEntry } from "@/lib/actions/accounting";
import { Plus, Wallet, TrendingUp, TrendingDown, Save } from "lucide-react";

export function CreateEntryDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"INGRESO" | "EGRESO">("INGRESO");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat((formData.get("amount") as string) || "0");
    const concept = (formData.get("concept") as string) || "Otros";
    const date = (formData.get("date") as string) || new Date().toISOString().split("T")[0];
    const description = (formData.get("description") as string) || "";

    await createAccountEntry({
      date,
      description,
      concept,
      debe: type === "EGRESO" ? amount : 0,
      haber: type === "INGRESO" ? amount : 0,
    });
    
    setLoading(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm gap-2">
          <Plus className="h-4 w-4" /> Nuevo Movimiento
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[450px] dark:bg-slate-950 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <Wallet className="h-5 w-5 text-blue-500" /> Registrar Movimiento
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              className={`flex-1 gap-2 ${type === "INGRESO" ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-500 hover:text-emerald-600"}`}
              onClick={() => setType("INGRESO")}
            >
              <TrendingUp className="h-4 w-4" /> Ingreso
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={`flex-1 gap-2 ${type === "EGRESO" ? "bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm" : "text-slate-500 hover:text-red-600"}`}
              onClick={() => setType("EGRESO")}
            >
              <TrendingDown className="h-4 w-4" /> Egreso
            </Button>
          </div>

          <div className="grid gap-2">
            <Label className="dark:text-gray-300">Descripción <span className="text-red-500">*</span></Label>
            <Input name="description" placeholder="Ej: Pago de honorarios Perez" required className="dark:bg-slate-900 dark:border-slate-800"/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="dark:text-gray-300">Monto ($) <span className="text-red-500">*</span></Label>
              <Input name="amount" type="number" step="0.01" min="0" placeholder="0.00" required className="dark:bg-slate-900 dark:border-slate-800 text-lg font-mono"/>
            </div>
            
            <div className="grid gap-2">
              <Label className="dark:text-gray-300">Fecha</Label>
              <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="dark:bg-slate-900 dark:border-slate-800"/>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="dark:text-gray-300">Categoría / Concepto <span className="text-red-500">*</span></Label>
            <Select name="concept" required>
              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                <SelectItem value="Honorarios">Honorarios Profesionales</SelectItem>
                <SelectItem value="Alquileres">Alquileres / Expensas</SelectItem>
                <SelectItem value="Adelanto">Adelanto de Gastos</SelectItem>
                <SelectItem value="Sueldos">Sueldos y Cargas</SelectItem>
                <SelectItem value="Préstamos">Mutuos / Préstamos</SelectItem>
                <SelectItem value="Impuestos">Impuestos / Tasas</SelectItem>
                <SelectItem value="Otros">Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 mt-2 gap-2">
            {loading ? "Guardando..." : <><Save className="h-4 w-4" /> Guardar Registro</>}
          </Button>

        </form>
      </DialogContent>
    </Dialog>
  );
}
