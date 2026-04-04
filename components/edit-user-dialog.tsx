"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUser } from "@/lib/actions/users";
import { AlertTriangle, Pencil } from "lucide-react";

interface EditUserDialogProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  actorEmail?: string | null;
  canChangeRole?: boolean;
}

export function EditUserDialog({ user, actorEmail, canChangeRole = true }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);

    const result = await updateUser(formData);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[460px] dark:border-slate-800 dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Editar usuario</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="grid gap-4 py-4">
          <input type="hidden" name="id" value={user.id} />
          <input type="hidden" name="actorEmail" value={actorEmail || ""} />

          <div className="grid gap-2">
            <Label>Nombre completo <span className="text-red-500">*</span></Label>
            <Input name="name" defaultValue={user.name || ""} required className="dark:border-slate-800 dark:bg-slate-900" />
          </div>

          <div className="grid gap-2">
            <Label>Email <span className="text-red-500">*</span></Label>
            <Input name="email" type="email" defaultValue={user.email} required className="dark:border-slate-800 dark:bg-slate-900" />
          </div>

          <div className="grid gap-2">
            <Label>Rol</Label>
            <select
              name="role"
              defaultValue={user.role}
              disabled={!canChangeRole}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              <option value="USER">Usuario</option>
              <option value="ADMIN">Administrador</option>
            </select>
            {!canChangeRole && (
              <p className="text-xs text-slate-500">No se puede cambiar este rol desde aqui por seguridad.</p>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-blue-600 text-white hover:bg-blue-700">
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>

          {error && (
            <div className="flex items-center gap-2 rounded bg-red-50 p-2 text-sm text-red-500">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
