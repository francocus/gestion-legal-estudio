"use client";

import { useState } from "react";
import { analyzeLegalModification } from "@/lib/actions/ia";
import { Bot, AlertTriangle, Scale, Loader2, Sparkles, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LegalAnalysis } from "@/lib/ia/legal-analysis";

export function IaRealComparator() {
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState("");
  const [country, setCountry] = useState("Argentina");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<LegalAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!oldText || !newText) {
      setError("Pega ambos textos primero.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    setError(null);

    try {
      const result = await analyzeLegalModification(oldText, newText, country);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setAnalysis(result.analysis);
    } catch {
      setError("Hubo un error al conectar con la IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-start sm:items-center gap-4 flex-col sm:flex-row">
        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
          <Globe className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 w-full">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-1">
            Bajo que jurisdiccion debe analizar la IA?
          </label>
          <select
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="w-full sm:w-1/2 p-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
          >
            <option value="Argentina">Argentina (Derecho Argentino)</option>
            <option value="Paraguay">Paraguay (Derecho Paraguayo)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-red-600 dark:text-red-400">Texto anterior (derogado)</label>
          <textarea
            value={oldText}
            onChange={(event) => setOldText(event.target.value)}
            className="w-full h-40 p-3 rounded-xl border border-red-200 dark:border-red-900/50 dark:bg-slate-950 dark:text-gray-300 text-sm resize-none focus:ring-2 focus:ring-red-500 outline-none"
            placeholder="Pega aca el texto de la ley vieja..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-green-600 dark:text-green-400">Texto nuevo (vigente)</label>
          <textarea
            value={newText}
            onChange={(event) => setNewText(event.target.value)}
            className="w-full h-40 p-3 rounded-xl border border-green-200 dark:border-green-900/50 dark:bg-slate-950 dark:text-gray-300 text-sm resize-none focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="Pega aca como quedo redactada la ley ahora..."
          />
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !oldText || !newText}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 px-8 rounded-xl shadow-lg transition-all"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analizando jurisprudencia de {country}...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" /> Analizar con IA
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {analysis && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl p-6 shadow-sm relative overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
            <Bot className="h-3 w-3" /> Analisis completado ({country})
          </div>

          <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Reporte de modificatoria normativa
          </h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm uppercase tracking-wide">Que cambio?</h4>
              <p className="text-emerald-900 dark:text-emerald-100 mt-1">{analysis.resumen_cambio}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
              <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm uppercase tracking-wide flex items-center gap-2">
                <Scale className="h-4 w-4" /> El espiritu del legislador
              </h4>
              <p className="text-emerald-900 dark:text-emerald-100 mt-2 font-serif leading-relaxed">
                {analysis.espiritu_legislador}
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-900/50">
              <h4 className="font-bold text-amber-800 dark:text-amber-400 text-sm uppercase tracking-wide">Tip tactico para el estudio</h4>
              <p className="text-amber-900 dark:text-amber-200 mt-1 italic">{analysis.tip_litigio}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
