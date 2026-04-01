"use client";

import { useState } from "react";
import { Bot, GitCompareArrows, Loader2, Sparkles } from "lucide-react";
import { analyzeLegalModification } from "@/lib/actions/ia";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LegalSourceComparatorDialogProps {
  title: string;
  country: string;
  previousText: string | null;
  currentText: string;
}

export function LegalSourceComparatorDialog({
  title,
  country,
  previousText,
  currentText,
}: LegalSourceComparatorDialogProps) {
  const [open, setOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{
    resumen_cambio: string;
    espiritu_legislador: string;
    tip_litigio: string;
  } | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <GitCompareArrows className="h-4 w-4" />
          Comparar texto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl max-h-[85vh] overflow-hidden dark:bg-slate-950 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">{title}</DialogTitle>
        </DialogHeader>

        {!previousText ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            Esta fuente todavia no tiene una version anterior guardada para comparar.
          </div>
        ) : (
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 dark:border-red-900/40 dark:bg-red-950/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-300">Texto anterior</h4>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">{previousText}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Texto vigente</h4>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">{currentText}</p>
              </div>
            </div>

            <Button
              onClick={async () => {
                setIsAnalyzing(true);
                setError(null);
                setAnalysis(null);
                const result = await analyzeLegalModification(previousText, currentText, country);
                setIsAnalyzing(false);
                if (!result.success) {
                  setError(result.error);
                  return;
                }
                setAnalysis(result.analysis);
              }}
              disabled={isAnalyzing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Analizar modificatoria
            </Button>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {analysis && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <Bot className="h-4 w-4" /> Analisis IA
                </h4>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Que cambio</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{analysis.resumen_cambio}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Enfoque normativo</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{analysis.espiritu_legislador}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Observacion estrategica</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{analysis.tip_litigio}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
