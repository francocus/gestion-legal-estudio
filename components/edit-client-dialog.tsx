"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateClient } from "@/app/actions";
import { santaFeCities } from "@/lib/santa-fe-cities";
// 👇 IMPORTACIÓN DE ICONOS
import { Pencil } from "lucide-react";

interface Props {
  client: any;
}

export function EditClientDialog({ client }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Formato para el input date
  const formattedDate = client.birthDate 
    ? new Date(client.birthDate).toISOString().split('T')[0] 
    : "";

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    await updateClient(formData);
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
            className="ml-auto gap-2 border-gray-300 text-gray-700 hover:bg-gray-100 dark:bg-slate-900 dark:border-slate-800 dark:text-gray-300 dark:hover:bg-slate-800 shadow-sm transition-all"
        >
          <Pencil className="h-3.5 w-3.5" /> Editar Ficha
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:bg-slate-950 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Editar Cliente</DialogTitle>
        </DialogHeader>
        
        <form 
          action={handleSubmit}
          className="grid gap-4 py-4"
        >
          <input type="hidden" name="id" value={client.id} />

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="dark:text-gray-300">Nombre <span className="text-red-500">*</span></Label>
              <Input name="firstName" defaultValue={client.firstName} required className="dark:bg-slate-900 dark:border-slate-800" />
            </div>
            <div className="grid gap-2">
              <Label className="dark:text-gray-300">Apellido <span className="text-red-500">*</span></Label>
              <Input name="lastName" defaultValue={client.lastName} required className="dark:bg-slate-900 dark:border-slate-800" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2 col-span-1">
                <Label className="dark:text-gray-300">Tipo</Label>
                <Select name="docType" defaultValue={client.docType || "DNI"}>
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
                <Input name="dni" type="number" defaultValue={client.dni || ""} className="dark:bg-slate-900 dark:border-slate-800" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="dark:text-gray-300">Teléfono Principal</Label>
            <Input name="phone" defaultValue={client.phone || ""} className="dark:bg-slate-900 dark:border-slate-800" />
          </div>

          <div className="border-t border-gray-200 dark:border-slate-800 my-2 pt-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Detalles Adicionales
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
               <Label className="dark:text-gray-300">CUIT / CUIL</Label>
               <Input name="cuit" defaultValue={client.cuit || ""} className="dark:bg-slate-900 dark:border-slate-800" />
             </div>
             <div className="grid gap-2">
               <Label className="dark:text-gray-300">Nacionalidad</Label>
               <Input name="nationality" defaultValue={client.nationality || "Argentina"} className="dark:bg-slate-900 dark:border-slate-800" />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label className="dark:text-gray-300">Fecha Nacimiento</Label>
                <Input name="birthDate" type="date" defaultValue={formattedDate} className="dark:bg-slate-900 dark:border-slate-800" />
            </div>
            <div className="grid gap-2">
                <Label className="dark:text-gray-300">Sexo</Label>
                <Select name="gender" defaultValue={client.gender || "EMPTY_SELECTION"}>
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
               <Label className="dark:text-gray-300">Lugar Nacimiento</Label>
               <Input name="birthPlace" defaultValue={client.birthPlace || ""} className="dark:bg-slate-900 dark:border-slate-800" />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
               <Label className="dark:text-gray-300">Domicilio</Label>
               <Input name="address" defaultValue={client.address || ""} className="dark:bg-slate-900 dark:border-slate-800" />
             </div>
             <div className="grid gap-2">
                <Label className="dark:text-gray-300">Ciudad</Label>
                <Select name="location" defaultValue={client.location || "EMPTY_SELECTION"}>
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

          <div className="grid gap-2">
             <Label className="dark:text-gray-300">Email</Label>
             <Input name="email" defaultValue={client.email || ""} className="dark:bg-slate-900 dark:border-slate-800" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label className="dark:text-gray-300">Ocupación</Label>
                <Input name="occupation" defaultValue={client.occupation || ""} className="dark:bg-slate-900 dark:border-slate-800" />
             </div>
             <div className="grid gap-2">
                <Label className="dark:text-gray-300">Tel. Familiar</Label>
                <Input name="familyPhone" defaultValue={client.familyPhone || ""} className="dark:bg-slate-900 dark:border-slate-800" />
             </div>
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