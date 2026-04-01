"use client";
/* eslint-disable react/no-unescaped-entities */

import { Bot, AlertTriangle, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function IaComparatorDemo() {
  return (
    <div className="space-y-6">
      
      {/* PANEL DE ANÁLISIS DE LA IA */}
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
          <Bot className="h-3 w-3" /> IA InfoLeg Activa
        </div>
        
        <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-400 mb-3 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
          ¡Atención! Modificación Detectada
        </h3>
        
        <p className="text-emerald-800 dark:text-emerald-200 text-sm leading-relaxed mb-4">
          <strong>Análisis del espíritu del legislador:</strong> La nueva modificatoria busca agilizar el proceso de notificación electrónica. Al eliminar el requisito de formato papel impreso y dar por válida la notificación al servidor del juzgado, la intención (el "espíritu") es reducir la mora judicial y los costos de tramitación para las partes.
          <br /><br />
          <em>💡 Tip Jurídico:</em> Podrías plantear la nulidad si la contraparte insiste en exigir el formato físico basándose en la redacción anterior.
        </p>
      </div>

      {/* COMPARADOR DE TEXTOS (SPLIT SCREEN) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* TEXTO ANTERIOR (DEROGADO) */}
        <div className="bg-white dark:bg-slate-950 border border-red-200 dark:border-red-900/50 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-red-50 dark:bg-red-900/20 px-4 py-3 border-b border-red-100 dark:border-red-900/50 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <h4 className="font-bold text-red-700 dark:text-red-400 text-sm">Texto Anterior (Derogado)</h4>
          </div>
          <div className="p-5 font-serif text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
            Art. 135.- Las notificaciones se harán en formato impreso y <span className="bg-red-200 dark:bg-red-900/60 text-red-900 dark:text-red-200 line-through px-1 rounded">por duplicado papel</span>, debiendo el oficial notificador dejar constancia física en el expediente principal. <span className="bg-red-200 dark:bg-red-900/60 text-red-900 dark:text-red-200 line-through px-1 rounded">Bajo pena de nulidad.</span>
          </div>
        </div>

        {/* TEXTO NUEVO (VIGENTE) */}
        <div className="bg-white dark:bg-slate-950 border border-green-200 dark:border-green-900/50 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-green-50 dark:bg-green-900/20 px-4 py-3 border-b border-green-100 dark:border-green-900/50 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <h4 className="font-bold text-green-700 dark:text-green-400 text-sm">Texto Nuevo (Vigente)</h4>
          </div>
          <div className="p-5 font-serif text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
            Art. 135.- Las notificaciones se harán en formato impreso y <span className="bg-green-200 dark:bg-green-900/60 text-green-900 dark:text-green-200 font-bold px-1 rounded">mediante soporte electrónico (SFE)</span>, debiendo el oficial notificador dejar constancia física <span className="bg-green-200 dark:bg-green-900/60 text-green-900 dark:text-green-200 font-bold px-1 rounded">o digital</span> en el expediente principal.
          </div>
        </div>

      </div>

      <div className="flex justify-end pt-4">
        <Link href="/biblioteca">
          <Button variant="outline" className="flex items-center gap-2">
            Volver a la Biblioteca <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

    </div>
  );
}
