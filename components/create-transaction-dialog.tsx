"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTransaction } from "@/app/actions";

export function CreateTransactionDialog({ caseId, clientId }: { caseId: string, clientId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
          💸 Registrar Pago/Gasto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>Movimiento de Caja</DialogTitle></DialogHeader>
        
        <form action={async (formData) => { await createTransaction(formData); setOpen(false); }} className="grid gap-4 py-4">
          <input type="hidden" name="caseId" value={caseId} />
          <input type="hidden" name="clientId" value={clientId} />

          <div className="grid gap-2">
            <Label>Tipo</Label>
            <Select name="type" required defaultValue="EXPENSE">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE">🔴 Gasto (Sale plata)</SelectItem>
                <SelectItem value="INCOME">🟢 Honorario (Entra plata)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Monto ($)</Label>
            <Input name="amount" type="number" step="0.01" placeholder="0.00" required />
          </div>

          <div className="grid gap-2">
            <Label>Descripción</Label>
            <Input name="description" placeholder="Ej: Bono ley, Gastos de inicio..." required />
          </div>

          <Button type="submit" className="w-full bg-green-700 hover:bg-green-800">Guardar Dinero</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}