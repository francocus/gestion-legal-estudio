"use client";

import { useState, useEffect } from "react";
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
import { Calculator, ArrowRightLeft, RefreshCcw } from "lucide-react";

interface Props {
  valorJus: number;
}

export function JusCalculator({ valorJus }: Props) {
  const [open, setOpen] = useState(false);
  const [jus, setJus] = useState<string>("1");
  const [pesos, setPesos] = useState<string>(valorJus.toString());

  // Cuando cambia JUS -> Calcula Pesos
  const handleJusChange = (val: string) => {
    setJus(val);
    if (val === "") {
        setPesos("");
        return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
        setPesos((num * valorJus).toFixed(2));
    }
  };

  // Cuando cambia Pesos -> Calcula JUS
  const handlePesosChange = (val: string) => {
    setPesos(val);
    if (val === "") {
        setJus("");
        return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
        setJus((num / valorJus).toFixed(2));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
            variant="ghost" 
            size="sm" 
            className="text-blue-100 hover:text-white hover:bg-white/20 h-8 px-2 absolute top-4 right-4"
            title="Abrir Calculadora"
        >
          <Calculator className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[380px] dark:bg-slate-950 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Calculadora de Honorarios
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
            
            {/* TASA DE REFERENCIA */}
            <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Valor JUS Actual:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">$ {valorJus.toLocaleString("es-AR")}</span>
            </div>

            <div className="space-y-4">
                {/* INPUT JUS */}
                <div className="grid gap-2">
                    <Label htmlFor="jus" className="text-blue-600 font-bold">Cantidad de JUS</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">JUS</span>
                        <Input 
                            id="jus" 
                            type="number" 
                            value={jus}
                            onChange={(e) => handleJusChange(e.target.value)}
                            className="pl-10 font-bold text-lg dark:bg-slate-900 dark:border-slate-800"
                        />
                    </div>
                </div>

                {/* CONECTOR VISUAL */}
                <div className="flex justify-center text-slate-300 dark:text-slate-600">
                    <ArrowRightLeft className="h-5 w-5 rotate-90" />
                </div>

                {/* INPUT PESOS */}
                <div className="grid gap-2">
                    <Label htmlFor="pesos" className="text-emerald-600 font-bold">Monto en Pesos</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                        <Input 
                            id="pesos" 
                            type="number" 
                            value={pesos}
                            onChange={(e) => handlePesosChange(e.target.value)}
                            className="pl-8 font-bold text-lg dark:bg-slate-900 dark:border-slate-800 text-emerald-600 dark:text-emerald-400"
                        />
                    </div>
                </div>
            </div>

            <Button onClick={() => {setJus("10"); handleJusChange("10")}} variant="outline" size="sm" className="text-xs text-slate-500 border-dashed dark:border-slate-700">
                Ejemplo: 10 JUS (Mínimo usual)
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}