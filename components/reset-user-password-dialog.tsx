"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetUserPassword } from "@/lib/actions/users";
import { AlertTriangle, KeyRound } from "lucide-react";

interface ResetUserPasswordDialogProps {
  userId: string;
  actorEmail?: string | null;
}

export function ResetUserPasswordDialog({ userId, actorEmail }: ResetUserPasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);

    const result = await resetUserPassword(formData);
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
          <KeyRound className="h-3.5 w-3.5" />
          Resetear clave
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px] dark:border-slate-800 dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Nueva contraseña provisoria</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="grid gap-4 py-4">
          <input type="hidden" name="id" value={userId} />
          <input type="hidden" name="actorEmail" value={actorEmail || ""} />

          <div className="grid gap-2">
            <Label>Nueva contraseña <span className="text-red-500">*</span></Label>
            <Input name="password" type="password" required minLength={6} className="dark:border-slate-800 dark:bg-slate-900" />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-blue-600 text-white hover:bg-blue-700">
            {loading ? "Actualizando..." : "Guardar contraseña"}
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
