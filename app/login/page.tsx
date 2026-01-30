"use client";

import { useActionState } from "react";
import { authenticate } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  // Mantenemos tu lógica original que funciona con React 19 / Next.js 15
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
        <CardHeader className="text-center pb-2">
          {/* Logo / Icono con fondo discreto */}
          <div className="mx-auto mb-4 bg-slate-800 h-16 w-16 rounded-full flex items-center justify-center border border-slate-700 shadow-inner">
             <span className="text-3xl">⚖️</span>
          </div>
          
          <CardTitle className="text-2xl font-bold text-white">Estudio Jurídico</CardTitle>
          <CardDescription className="text-slate-400">
            Ingreso Profesional
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form action={formAction} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="abogado@estudio.com" 
                required 
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Contraseña</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                required 
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* BOTÓN AZUL INSTITUCIONAL */}
            <Button 
                type="submit" 
                disabled={isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 transition-all shadow-lg shadow-blue-900/20 border border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Ingresando..." : "Ingresar al Sistema"}
            </Button>

            {/* MANEJO DE ERRORES */}
            {errorMessage && (
              <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/30 flex items-center justify-center gap-2">
                 ⚠️ {errorMessage}
              </div>
            )}

          </form>
        </CardContent>
      </Card>
      
      {/* Footer discreto */}
      <div className="absolute bottom-4 text-center text-xs text-slate-600">
        &copy; {new Date().getFullYear()} Sistema de Gestión Legal
      </div>
      
    </div>
  );
}