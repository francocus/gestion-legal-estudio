"use client";

import { useActionState, useEffect } from "react";
import { changeOwnPassword } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, KeyRound, Lock, ShieldCheck } from "lucide-react";

interface ChangePasswordFormProps {
  email: string;
  name?: string | null;
}

export function ChangePasswordForm({ email, name }: ChangePasswordFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prevState: Awaited<ReturnType<typeof changeOwnPassword>> | undefined, formData: FormData) =>
      changeOwnPassword(formData),
    undefined
  );

  useEffect(() => {
    if (state?.success) {
      window.location.href = "/";
    }
  }, [state]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.95),_transparent_42%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] [background-size:42px_42px]" />

      <Card className="relative w-full max-w-md border-slate-800 bg-slate-900/95 shadow-2xl shadow-blue-950/20 backdrop-blur-sm">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 shadow-inner">
            <ShieldCheck className="h-8 w-8 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">Actualiza tu clave</CardTitle>
            <CardDescription className="mt-2 text-slate-400">
              {name ? `${name}, antes de continuar tenes que reemplazar la clave provisoria.` : "Antes de continuar tenes que reemplazar la clave provisoria."}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="email" value={email} />

            <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300">
              <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Cuenta</span>
              <span className="mt-1 block">{email}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="flex items-center gap-2 text-slate-300">
                <KeyRound className="h-4 w-4 text-blue-500" /> Clave actual
              </Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2 text-slate-300">
                <Lock className="h-4 w-4 text-blue-500" /> Nueva clave
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={6}
                required
                className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300">
                Confirmar nueva clave
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                minLength={6}
                required
                className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>

            <Button
              type="submit"
              disabled={isPending || Boolean(state?.success)}
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              {isPending ? "Actualizando..." : "Guardar nueva clave"}
            </Button>

            {state?.success && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3 text-sm text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                {state.message || "Clave actualizada correctamente."}
              </div>
            )}

            {state && !state.success && (
              <div className="flex items-center gap-2 rounded-xl border border-red-900/40 bg-red-950/20 p-3 text-sm text-red-400">
                <AlertTriangle className="h-4 w-4" />
                {state.error}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
