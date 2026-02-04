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
import { createClient } from "@/app/actions";
import { santaFeCities } from "@/lib/santa-fe-cities";
// 👇 IMPORTACIÓN DE ICONOS
import { UserPlus, ChevronDown, ChevronUp, Save } from "lucide-react";

export function CreateClientDialog() {
  const [open, setOpen] = useState(false);
  const [showAdditional, setShowAdditional] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    await createClient(formData);
    setLoading(false);
    setOpen(false);
    setShowAdditional(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* 🔵 ACCIÓN PRINCIPAL: AZUL */}
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition-all gap-2">
          <UserPlus className="h-4 w-4" /> Nuevo Cliente
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:bg-slate-950 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white text-xl">Ficha de Cliente</DialogTitle>
        </DialogHeader>
        
        <form action={handleSubmit} className="grid gap-4 py-4">
          
          {/* OBLIGATORIOS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="dark:text-gray-300">Nombre <span className="text-red-500">*</span></Label>
              <Input name="firstName" required className="dark:bg-slate-900 dark:border-slate-800" />
            </div>
            <div className="grid gap-2">
              <Label className="dark:text-gray-300">Apellido <span className="text-red-500">*</span></Label>
              <Input name="lastName" required className="dark:bg-slate-900 dark:border-slate-800" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2 col-span-1">
                <Label className="dark:text-gray-300">Tipo Doc</Label>
                <Select name="docType" defaultValue="DNI">
                    <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                        <SelectItem value="DNI">DNI</SelectItem>
                        <SelectItem value="LC">LC</SelectItem>
                        <SelectItem value="LE">LE</SelectItem>
                        <SelectItem value="PAS">PAS</SelectItem>
                        <SelectItem value="CI">CI</SelectItem>
                        <SelectItem value="CF">CF</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2 col-span-2">
                <Label className="dark:text-gray-300">Número</Label>
                <Input name="dni" type="number" placeholder="Sin puntos" className="dark:bg-slate-900 dark:border-slate-800" />
            </div>
          </div>
          
          <div className="grid gap-2">
             <Label className="dark:text-gray-300">Teléfono / Celular Principal</Label>
             <Input name="phone" className="dark:bg-slate-900 dark:border-slate-800" />
          </div>

          <div className="pt-2">
            {/* ⚪ ACCIÓN SECUNDARIA: GRIS / GHOST */}
            <Button 
                type="button" 
                variant="ghost" 
                className="w-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-dashed border-gray-300 dark:border-slate-700 dark:text-gray-400 dark:hover:bg-slate-900/50 gap-2"
                onClick={() => setShowAdditional(!showAdditional)}
            >
                {showAdditional ? (
                    <>
                        <ChevronUp className="h-4 w-4" /> Menos detalles
                    </>
                ) : (
                    <>
                        <ChevronDown className="h-4 w-4" /> Cargar Datos Adicionales (CUIT, Domicilio, etc.)
                    </>
                )}
            </Button>
          </div>

          {showAdditional && (
              <div className="grid gap-4 border-t border-gray-200 dark:border-slate-800 pt-4 bg-gray-50 dark:bg-slate-900/30 p-4 rounded-lg animate-in slide-in-from-top-2">
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="dark:text-gray-300">CUIT / CUIL</Label>
                        <Input name="cuit" placeholder="20-xxxxxxxx-x" className="dark:bg-slate-900 dark:border-slate-800" />
                      </div>
                      <div className="grid gap-2">
                        <Label className="dark:text-gray-300">Nacionalidad</Label>
                        <Input name="nationality" defaultValue="Argentina" className="dark:bg-slate-900 dark:border-slate-800" />
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label className="dark:text-gray-300">Fecha de Nacimiento</Label>
                        <Input name="birthDate" type="date" className="dark:bg-slate-900 dark:border-slate-800" />
                    </div>
                    <div className="grid gap-2">
                        <Label className="dark:text-gray-300">Sexo</Label>
                        <Select name="gender">
                            <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                                <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                                <SelectItem value="EMPTY_SELECTION" className="text-gray-400">-- No especificar --</SelectItem>
                                <SelectItem value="Masculino">Masculino</SelectItem>
                                <SelectItem value="Femenino">Femenino</SelectItem>
                                <SelectItem value="X">No Binario / Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                        <Label className="dark:text-gray-300">Lugar de Nacimiento</Label>
                        <Input name="birthPlace" placeholder="Ciudad, Provincia" className="dark:bg-slate-900 dark:border-slate-800" />
                  </div>

                  <div className="grid gap-2 mt-2">
                    <Label className="font-bold text-gray-700 dark:text-gray-200">Domicilio y Ubicación</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <Input name="address" placeholder="Calle y Altura" className="dark:bg-slate-900 dark:border-slate-800" />
                        
                        <Select name="location">
                            <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                                <SelectValue placeholder="Ciudad..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px] dark:bg-slate-900 dark:border-slate-800">
                                <SelectItem value="EMPTY_SELECTION" className="text-gray-400">-- No especificar --</SelectItem>
                                {santaFeCities.map(city => (
                                    <SelectItem key={city} value={city}>{city}</SelectItem>
                                ))}
                                <SelectItem value="OTRA">Otra / Fuera de Sta Fe</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                  </div>

                  <div className="grid gap-2 mt-2">
                      <Label className="font-bold text-gray-700 dark:text-gray-200">Otros Datos</Label>
                      <Input name="email" type="email" placeholder="Email" className="dark:bg-slate-900 dark:border-slate-800" />
                      <div className="grid grid-cols-2 gap-4">
                        <Input name="occupation" placeholder="Ocupación" className="dark:bg-slate-900 dark:border-slate-800" />
                        <Input name="familyPhone" placeholder="Tel. Familiar (Urgencia)" className="dark:bg-slate-900 dark:border-slate-800" />
                      </div>
                  </div>
              </div>
          )}

          {/* 🔵 ACCIÓN PRINCIPAL: AZUL VIBRANTE */}
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 transition-all shadow-md shadow-blue-900/20 mt-2 gap-2"
          >
            {loading ? "Guardando..." : (
                <>
                    <Save className="h-4 w-4" /> Guardar Ficha
                </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}