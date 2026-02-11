"use client";

import { useActionState } from "react";
import { registerUser } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle } from "lucide-react";

export function CreateUserForm() {
  // Manejamos el estado de la acción (éxito o error)
  const [state, formAction, isPending] = useActionState(registerUser, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre Completo</Label>
        <Input name="name" placeholder="Ej: Dr. Juan Pérez" required />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email Corporativo</Label>
        <Input name="email" type="email" placeholder="juan@estudio.com" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña Provisoria</Label>
        <Input name="password" type="password" placeholder="******" required />
      </div>

      <Button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        {isPending ? "Creando..." : "Crear Usuario"}
      </Button>

      {/* MENSAJES DE RESPUESTA */}
      {state?.error && (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-2 rounded">
          <AlertTriangle className="h-4 w-4" /> {state.error}
        </div>
      )}
      {state?.success && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-2 rounded">
          <CheckCircle className="h-4 w-4" /> {state.success}
        </div>
      )}
    </form>
  );
}