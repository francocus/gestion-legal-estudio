"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTransaction } from "@/app/actions";
// 👇 IMPORTACIÓN DE ICONOS
import { DollarSign, TrendingUp, TrendingDown, Save } from "lucide-react";

export function CreateTransactionDialog({ caseId, clientId }: { caseId: string, clientId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    formData.append("caseId", caseId);
    formData.append("clientId", clientId);
    
    await createTransaction(formData);
    
    setLoading(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* 🟢 ACCIÓN DE DINERO: VERDE ESMERALDA */}
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-sm transition-all">
            <DollarSign className="h-4 w-4" /> Registrar Pago/Gasto
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px] dark:bg-slate-950 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Registrar Movimiento</DialogTitle>
        </DialogHeader>
        
        <form action={handleSubmit} className="grid gap-4 py-4">
          
          <div className="grid gap-2">
            <Label className="dark:text-gray-300">Tipo de Movimiento</Label>
            <Select name="type" defaultValue="INCOME">
              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                <SelectItem value="INCOME">
                    <div className="flex items-center gap-2 text-emerald-500 font-bold">
                        <TrendingUp className="h-4 w-4" /> Ingreso (Cobro Honorarios)
                    </div>
                </SelectItem>
                <SelectItem value="EXPENSE">
                    <div className="flex items-center gap-2 text-red-500 font-bold">
                        <TrendingDown className="h-4 w-4" /> Gasto (Bono, Sellado, etc)
                    </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="dark:text-gray-300">Monto ($)</Label>
            <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">
                    <DollarSign className="h-4 w-4" />
                </span>
                <Input 
                    name="amount" 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    required 
                    className="pl-9 font-bold text-lg dark:bg-slate-900 dark:border-slate-800" 
                />
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="dark:text-gray-300">Descripción</Label>
            <Input 
                name="description" 
                placeholder="Ej: Pago parcial, Bono ley..." 
                required 
                className="dark:bg-slate-900 dark:border-slate-800" 
            />
          </div>

          {/* 🟢 BOTÓN GUARDAR: VERDE (Coherencia visual) */}
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold mt-2 gap-2"
          >
            {loading ? "Guardando..." : (
                <>
                    <Save className="h-4 w-4" /> Guardar Movimiento
                </>
            )}
          </Button>

        </form>
      </DialogContent>
    </Dialog>
  );
}