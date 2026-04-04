"use client";

import { useActionState } from "react";
import { registerUser } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle } from "lucide-react";

export function CreateUserForm() {
  const [state, formAction, isPending] = useActionState(registerUser, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre completo</Label>
        <Input id="name" name="name" placeholder="Ej: Dra. Laura Suarez" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email corporativo</Label>
        <Input id="email" name="email" type="email" placeholder="laura@estudio.com" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña provisoria</Label>
        <Input id="password" name="password" type="password" placeholder="******" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <select
          id="role"
          name="role"
          defaultValue="USER"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
        >
          <option value="USER">Usuario</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </div>

      <Button type="submit" disabled={isPending} className="w-full bg-blue-600 text-white hover:bg-blue-700">
        {isPending ? "Creando..." : "Crear usuario"}
      </Button>

      {state?.error && (
        <div className="flex items-center gap-2 rounded bg-red-50 p-2 text-sm text-red-500">
          <AlertTriangle className="h-4 w-4" /> {state.error}
        </div>
      )}
      {state?.success && (
        <div className="flex items-center gap-2 rounded bg-emerald-50 p-2 text-sm text-emerald-600">
          <CheckCircle className="h-4 w-4" /> {state.success}
        </div>
      )}
    </form>
  );
}
