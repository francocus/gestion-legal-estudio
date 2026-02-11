"use client";

// 👇 1. Importamos useEffect y useRouter (opcional, pero usamos window)
import { useActionState, useEffect } from "react"; 
import { authenticate } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Scale, AlertTriangle, LogIn, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  // 👇 2. Cambiamos el nombre 'errorMessage' a 'state' porque ahora puede traer éxito o error
  const [state, formAction, isPending] = useActionState(authenticate, undefined);

  // 👇 3. LA MAGIA: Este efecto vigila el resultado
  useEffect(() => {
    if (state === "success") {
      // 🚀 ESTO ES LO QUE ARREGLA TU PROBLEMA
      // Fuerza al navegador a cargar la página desde cero
      window.location.href = "/";
    }
  }, [state]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 bg-slate-800 h-16 w-16 rounded-full flex items-center justify-center border border-slate-700 shadow-inner group">
             <Scale className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          
          <CardTitle className="text-2xl font-bold text-white">Estudio Jurídico</CardTitle>
          <CardDescription className="text-slate-400">
            Ingreso Profesional
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form action={formAction} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" /> Email
              </Label>
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
              <Label htmlFor="password" className="text-slate-300 flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-500" /> Contraseña
              </Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                required 
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <Button 
                type="submit" 
                disabled={isPending || state === "success"} // Deshabilitamos si ya entró
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 transition-all shadow-lg shadow-blue-900/20 border border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending || state === "success" ? "Ingresando..." : (
                <>
                    Ingresar al Sistema <LogIn className="h-4 w-4" />
                </>
              )}
            </Button>

            {/* MANEJO DE ERRORES (Solo mostramos si NO es success) */}
            {state && state !== "success" && (
              <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/30 flex items-center justify-center gap-2">
                 <AlertTriangle className="h-4 w-4" /> {state}
              </div>
            )}

          </form>
        </CardContent>
      </Card>
      
      <div className="absolute bottom-4 text-center text-xs text-slate-600">
        &copy; {new Date().getFullYear()} Estudio Jurídico
      </div>
      
    </div>
  );
}