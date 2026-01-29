"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/app/actions";
import { santaFeCities } from "@/lib/santa-fe-cities";

export function CreateClientDialog() {
  const [open, setOpen] = useState(false);
  const [showAdditional, setShowAdditional] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-black hover:bg-gray-800 text-white font-bold">
          + Nuevo Cliente
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ficha de Cliente</DialogTitle>
        </DialogHeader>
        
        <form 
          action={async (formData) => {
            await createClient(formData);
            setOpen(false);
            setShowAdditional(false);
          }} 
          className="grid gap-4 py-4"
        >
          {/* OBLIGATORIOS CON ASTERISCO ROJO */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Nombre <span className="text-red-500">*</span></Label>
              <Input name="firstName" required />
            </div>
            <div className="grid gap-2">
              <Label>Apellido <span className="text-red-500">*</span></Label>
              <Input name="lastName" required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2 col-span-1">
                <Label>Tipo Doc</Label>
                <Select name="docType" defaultValue="DNI">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
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
                <Label>Número</Label>
                <Input name="dni" type="number" placeholder="Sin puntos" />
            </div>
          </div>
          
          <div className="grid gap-2">
             <Label>Teléfono / Celular Principal</Label>
             <Input name="phone" />
          </div>

          <div className="pt-2">
            <Button 
                type="button" 
                variant="ghost" 
                className="w-full text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-100"
                onClick={() => setShowAdditional(!showAdditional)}
            >
                {showAdditional ? "⬆️ Menos detalles" : "⬇️ Cargar Datos Adicionales (CUIT, Domicilio, etc.)"}
            </Button>
          </div>

          {showAdditional && (
              <div className="grid gap-4 border-t pt-4 bg-gray-50 p-4 rounded-lg animate-in slide-in-from-top-2">
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>CUIT / CUIL</Label>
                        <Input name="cuit" placeholder="20-xxxxxxxx-x" />
                      </div>
                      <div className="grid gap-2">
                        <Label>Nacionalidad</Label>
                        <Input name="nationality" defaultValue="Argentina" />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Fecha de Nacimiento</Label>
                        <Input name="birthDate" type="date" />
                    </div>
                    {/* SEXO: OPCIONAL CON EMPTY */}
                    <div className="grid gap-2">
                        <Label>Sexo</Label>
                        <Select name="gender">
                            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="EMPTY_SELECTION" className="text-gray-400">-- No especificar --</SelectItem>
                                <SelectItem value="Masculino">Masculino</SelectItem>
                                <SelectItem value="Femenino">Femenino</SelectItem>
                                <SelectItem value="X">No Binario / Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                        <Label>Lugar de Nacimiento</Label>
                        <Input name="birthPlace" placeholder="Ciudad, Provincia" />
                  </div>

                  <div className="grid gap-2 mt-2">
                    <Label className="font-bold text-gray-700">Domicilio y Ubicación</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <Input name="address" placeholder="Calle y Altura" />
                        
                        {/* CIUDAD: OPCIONAL CON EMPTY */}
                        <Select name="location">
                            <SelectTrigger><SelectValue placeholder="Ciudad de Santa Fe..." /></SelectTrigger>
                            <SelectContent className="max-h-[200px]">
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
                     <Label className="font-bold text-gray-700">Otros Datos</Label>
                     <Input name="email" type="email" placeholder="Email" />
                     <div className="grid grid-cols-2 gap-4">
                        <Input name="occupation" placeholder="Ocupación" />
                        <Input name="familyPhone" placeholder="Tel. Familiar (Urgencia)" />
                     </div>
                  </div>
              </div>
          )}

          <Button type="submit" className="w-full bg-black hover:bg-gray-800 mt-2">
            Guardar Ficha
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}