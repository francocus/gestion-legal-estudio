"use client";

import { useActionState, useEffect } from "react";
import { authenticate } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Scale, AlertTriangle, LogIn, Mail, Lock, RefreshCcw } from "lucide-react";

interface LoginFormProps {
  isSwitchUser?: boolean;
  email?: string;
  name?: string;
}

export function LoginForm({ isSwitchUser = false, email = "", name = "" }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(authenticate, undefined);

  useEffect(() => {
    if (state === "success") {
      window.location.href = "/";
    }
  }, [state]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.95),_transparent_42%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] [background-size:42px_42px]" />

      <Card className="relative w-full max-w-md border-slate-800 bg-slate-900/95 shadow-2xl shadow-blue-950/20 backdrop-blur-sm">
        <CardHeader className="pb-3 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 shadow-inner">
            <Scale className="h-8 w-8 text-blue-500" />
          </div>

          <CardTitle className="text-2xl font-bold text-white">Estudio Juridico</CardTitle>
          <CardDescription className="text-slate-400">Acceso al sistema</CardDescription>
        </CardHeader>

        <CardContent>
          {isSwitchUser && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-blue-900/40 bg-blue-950/20 p-3 text-sm text-blue-300">
              <RefreshCcw className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Cambiar usuario</p>
                <p className="text-blue-200/80">
                  {name ? `Ingresá la contraseña para continuar como ${name}.` : "Ingresá con otra cuenta para continuar en el sistema."}
                </p>
              </div>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-slate-300">
                <Mail className="h-4 w-4 text-blue-500" /> Email
              </Label>
              {isSwitchUser && email ? (
                <>
                  <input type="hidden" name="email" value={email} />
                  <div className="flex min-h-10 items-center rounded-md border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300">
                    {email}
                  </div>
                </>
              ) : (
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="abogado@estudio.com"
                  defaultValue={email}
                  required
                  className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-600 transition-all focus:border-blue-500 focus:ring-blue-500/20"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2 text-slate-300">
                <Lock className="h-4 w-4 text-blue-500" /> Contraseña
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-600 transition-all focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>

            <Button
              type="submit"
              disabled={isPending || state === "success"}
              className="flex w-full items-center justify-center gap-2 border border-blue-500 bg-blue-600 py-2 font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending || state === "success" ? (
                "Ingresando..."
              ) : (
                <>
                  Ingresar
                  <LogIn className="h-4 w-4" />
                </>
              )}
            </Button>

            {state && state !== "success" && (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-red-900/40 bg-red-950/20 p-3 text-center text-sm text-red-400">
                <AlertTriangle className="h-4 w-4" />
                {state}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <div className="absolute bottom-4 text-center text-[11px] text-slate-600">
        © {new Date().getFullYear()} Estudio Juridico Digital
      </div>
    </div>
  );
}
