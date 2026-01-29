"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateClient } from "@/app/actions";
import { santaFeCities } from "@/lib/santa-fe-cities";

interface Props {
  client: any;
}

export function EditClientDialog({ client }: Props) {
  const [open, setOpen] = useState(false);

  // Formato para el input date
  const formattedDate = client.birthDate 
    ? new Date(client.birthDate).toISOString().split('T')[0] 
    : "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto">
          ✏️ Editar Ficha
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>
        
        <form 
          action={async (formData) => {
            await updateClient(formData);
            setOpen(false);
          }} 
          className="grid gap-4 py-4"
        >
          <input type="hidden" name="id" value={client.id} />

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Nombre <span className="text-red-500">*</span></Label>
              <Input name="firstName" defaultValue={client.firstName} required />
            </div>
            <div className="grid gap-2">
              <Label>Apellido <span className="text-red-500">*</span></Label>
              <Input name="lastName" defaultValue={client.lastName} required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2 col-span-1">
                <Label>Tipo</Label>
                <Select name="docType" defaultValue={client.docType || "DNI"}>
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
                <Input name="dni" type="number" defaultValue={client.dni || ""} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Teléfono Principal</Label>
            <Input name="phone" defaultValue={client.phone || ""} />
          </div>

          <div className="border-t my-2 pt-2 text-sm font-bold text-gray-500 uppercase">Detalles Adicionales</div>

          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
               <Label>CUIT / CUIL</Label>
               <Input name="cuit" defaultValue={client.cuit || ""} />
             </div>
             <div className="grid gap-2">
               <Label>Nacionalidad</Label>
               <Input name="nationality" defaultValue={client.nationality || "Argentina"} />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label>Fecha Nacimiento</Label>
                <Input name="birthDate" type="date" defaultValue={formattedDate} />
            </div>
            {/* SEXO: OPCIÓN VACÍA */}
            <div className="grid gap-2">
                <Label>Sexo</Label>
                <Select name="gender" defaultValue={client.gender || "EMPTY_SELECTION"}>
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
               <Label>Lugar Nacimiento</Label>
               <Input name="birthPlace" defaultValue={client.birthPlace || ""} />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
               <Label>Domicilio</Label>
               <Input name="address" defaultValue={client.address || ""} />
             </div>
             {/* CIUDAD: OPCIÓN VACÍA */}
             <div className="grid gap-2">
                <Label>Ciudad</Label>
                <Select name="location" defaultValue={client.location || "EMPTY_SELECTION"}>
                    <SelectTrigger><SelectValue placeholder="Ciudad..." /></SelectTrigger>
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

          <div className="grid gap-2">
             <Label>Email</Label>
             <Input name="email" defaultValue={client.email || ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label>Ocupación</Label>
                <Input name="occupation" defaultValue={client.occupation || ""} />
             </div>
             <div className="grid gap-2">
                <Label>Tel. Familiar</Label>
                <Input name="familyPhone" defaultValue={client.familyPhone || ""} />
             </div>
          </div>

          <Button type="submit" className="w-full">Guardar Cambios</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}