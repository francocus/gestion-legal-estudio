"use client";

import { useState } from "react";
import { Bot, Loader2, Sparkles, FileSearch, ListChecks, Save } from "lucide-react";
import { analyzeCase, organizeCaseNotes } from "@/lib/actions/ia";
import { createNote } from "@/lib/actions/notes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CaseAiToolsProps {
  caseId: string;
  clientId: string;
  caratula: string;
  area: string;
  description: string;
  notes: string[];
  legalSources: Array<{
    title: string;
    type: string;
    area: string;
    country: string;
  }>;
  defaultCountry?: string;
}

export function CaseAiTools({
  caseId,
  clientId,
  caratula,
  area,
  description,
  notes,
  legalSources,
  defaultCountry = "Argentina",
}: CaseAiToolsProps) {
  const [country, setCountry] = useState(defaultCountry);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [savingType, setSavingType] = useState<"analysis" | "notes" | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    resumen_caso: string;
    puntos_juridicos: string[];
    riesgos: string[];
    proximos_pasos: string[];
  } | null>(null);
  const [organizedNotesResult, setOrganizedNotesResult] = useState<{
    hechos_relevantes: string[];
    objetivo_del_caso: string;
    pendientes: string[];
    prueba_a_reunir: string[];
    lineas_de_argumento: string[];
  } | null>(null);

  const renderCompactList = (items: string[]) => (
    <ul className="mt-2 space-y-2 text-sm leading-5 text-slate-700 dark:text-slate-200">
      {items.map((item, index) => (
        <li key={index} className="rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/70">
          {item}
        </li>
      ))}
    </ul>
  );

  const handleSaveAsNote = async (type: "analysis" | "notes") => {
    const content =
      type === "analysis" && analysisResult
        ? [
            "Analisis del expediente por IA",
            "",
            `Resumen: ${analysisResult.resumen_caso}`,
            "",
            "Puntos juridicos:",
            ...analysisResult.puntos_juridicos.map((item) => `- ${item}`),
            "",
            "Riesgos:",
            ...analysisResult.riesgos.map((item) => `- ${item}`),
            "",
            "Proximos pasos:",
            ...analysisResult.proximos_pasos.map((item) => `- ${item}`),
          ].join("\n")
        : organizedNotesResult
          ? [
              "Notas ordenadas por IA",
              "",
              "Hechos relevantes:",
              ...organizedNotesResult.hechos_relevantes.map((item) => `- ${item}`),
              "",
              `Objetivo del caso: ${organizedNotesResult.objetivo_del_caso}`,
              "",
              "Pendientes:",
              ...organizedNotesResult.pendientes.map((item) => `- ${item}`),
              "",
              "Prueba a reunir:",
              ...organizedNotesResult.prueba_a_reunir.map((item) => `- ${item}`),
              "",
              "Lineas de argumento:",
              ...organizedNotesResult.lineas_de_argumento.map((item) => `- ${item}`),
            ].join("\n")
          : "";

    if (!content) return;

    setSavingType(type);
    await createNote(caseId, clientId, content, "TEXT");
    setSavingType(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bot className="h-5 w-5 text-emerald-500" />
            Asistente de IA
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Analiza el expediente, ordena las notas y genera un esquema de trabajo inicial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Pais</label>
          <select
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            <option value="Argentina">Argentina</option>
            <option value="Paraguay">Paraguay</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <FileSearch className="h-4 w-4" />
              Analizar expediente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden dark:bg-slate-950 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Analisis del expediente</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Genera un resumen breve con puntos centrales, riesgos y pasos sugeridos.
                  </p>
                  <Button
                    onClick={async () => {
                      setLoadingAnalysis(true);
                      setAnalysisError(null);
                      setAnalysisResult(null);
                      const result = await analyzeCase({
                        country,
                        caratula,
                        area,
                        description,
                        notes,
                        legalSources,
                      });
                      setLoadingAnalysis(false);
                      if (!result.success) {
                        setAnalysisError(result.error);
                        return;
                      }
                      setAnalysisResult(result.analysis);
                    }}
                    disabled={loadingAnalysis}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    {loadingAnalysis ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Ejecutar analisis
                  </Button>
                </div>
              </div>

              {analysisError && <p className="text-sm text-red-500">{analysisError}</p>}

              {analysisResult && (
                <div className="max-h-[62vh] space-y-4 overflow-y-auto pr-2">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20 lg:col-span-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Resumen del caso</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{analysisResult.resumen_caso}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Puntos juridicos centrales</h4>
                      {renderCompactList(analysisResult.puntos_juridicos)}
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Riesgos o debilidades</h4>
                      {renderCompactList(analysisResult.riesgos)}
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/20 lg:col-span-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Proximos pasos sugeridos</h4>
                      {renderCompactList(analysisResult.proximos_pasos)}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => handleSaveAsNote("analysis")}
                      disabled={savingType === "analysis"}
                    >
                      {savingType === "analysis" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Guardar como nota
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <ListChecks className="h-4 w-4" />
              Ordenar notas
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden dark:bg-slate-950 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Organizacion de notas</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Ordena las notas del expediente en un esquema breve y util para trabajar.
                  </p>
                  <Button
                    onClick={async () => {
                      setLoadingNotes(true);
                      setNotesError(null);
                      setOrganizedNotesResult(null);
                      const result = await organizeCaseNotes({
                        notes,
                        country,
                        area,
                        caratula,
                      });
                      setLoadingNotes(false);
                      if (!result.success) {
                        setNotesError(result.error);
                        return;
                      }
                      setOrganizedNotesResult(result.analysis);
                    }}
                    disabled={loadingNotes}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    {loadingNotes ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Ordenar con IA
                  </Button>
                </div>
              </div>

              {notesError && <p className="text-sm text-red-500">{notesError}</p>}

              {organizedNotesResult && (
                <div className="max-h-[62vh] space-y-4 overflow-y-auto pr-2">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Hechos relevantes</h4>
                      {renderCompactList(organizedNotesResult.hechos_relevantes)}
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Objetivo del caso</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{organizedNotesResult.objetivo_del_caso}</p>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Pendientes</h4>
                      {renderCompactList(organizedNotesResult.pendientes)}
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Prueba o documentacion a reunir</h4>
                      {renderCompactList(organizedNotesResult.prueba_a_reunir)}
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/20 lg:col-span-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Lineas de argumento</h4>
                      {renderCompactList(organizedNotesResult.lineas_de_argumento)}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => handleSaveAsNote("notes")}
                      disabled={savingType === "notes"}
                    >
                      {savingType === "notes" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Guardar como nota
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
