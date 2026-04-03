"use client";

import { useState } from "react";
import type { LegalSourceType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Scale, Link2, Unlink, ExternalLink, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LegalSourceComparatorDialog } from "@/components/legal-source-comparator-dialog";
import {
  attachLegalSourceToCase,
  detachLegalSourceFromCase,
} from "@/lib/actions/case-sources";

interface LinkedLegalSource {
  id: string;
  title: string;
  officialNumber?: string | null;
  officialName?: string | null;
  type: LegalSourceType;
  area: string;
  country: string;
  officialText?: string | null;
  sourceUrl: string | null;
  content?: string;
  previousText?: string | null;
}

interface CaseLegalSourcesPanelProps {
  caseId: string;
  clientId: string;
  caseArea: string;
  linkedSources: LinkedLegalSource[];
  suggestedSources: LinkedLegalSource[];
}

function sourceTypeLabel(type: LegalSourceType) {
  switch (type) {
    case "LAW":
      return "Ley especial";
    case "CODE":
      return "Codigo";
    case "CONSTITUTION":
      return "Constitucion";
    case "JURISPRUDENCE":
      return "Fallo";
    default:
      return "Otra fuente";
  }
}

export function CaseLegalSourcesPanel({
  caseId,
  clientId,
  caseArea,
  linkedSources,
  suggestedSources,
}: CaseLegalSourcesPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleAttach = async (legalSourceId: string) => {
    setPendingId(legalSourceId);
    setError(null);

    const formData = new FormData();
    formData.set("caseId", caseId);
    formData.set("clientId", clientId);
    formData.set("legalSourceId", legalSourceId);

    const result = await attachLegalSourceToCase(formData);
    if (!result.success) {
      setError(result.error);
    } else {
      router.refresh();
    }

    setPendingId(null);
  };

  const handleDetach = async (legalSourceId: string) => {
    setPendingId(legalSourceId);
    setError(null);

    const formData = new FormData();
    formData.set("caseId", caseId);
    formData.set("clientId", clientId);
    formData.set("legalSourceId", legalSourceId);

    const result = await detachLegalSourceFromCase(formData);
    if (!result.success) {
      setError(result.error);
    } else {
      router.refresh();
    }

    setPendingId(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="h-5 w-5 text-indigo-500" />
            Fuentes juridicas vinculadas
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Relaciona leyes, codigos, constituciones y fallos con este expediente para tener contexto juridico directo.
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          Area {caseArea}
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
          <BookOpen className="h-4 w-4 text-indigo-500" />
          Vinculadas al expediente
        </div>
        {linkedSources.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-5 text-sm text-slate-500 dark:text-slate-400">
            Todavia no hay fuentes juridicas asociadas a este expediente.
          </div>
        ) : (
          <div className="grid gap-3">
            {linkedSources.map((source) => (
              <div
                key={source.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40 p-4 flex flex-col gap-4"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                        {source.country}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {source.area}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {sourceTypeLabel(source.type)}
                      </span>
                      {source.previousText && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                          Modificatoria cargada
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-base">{source.title}</p>
                      <div className={`mt-3 grid gap-2 text-xs ${["LAW", "CODE", "CONSTITUTION"].includes(source.type) ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3"}`}>
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                          <p className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Numero / caratula</p>
                          <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{source.officialNumber || "Sin dato"}</p>
                        </div>
                        {!["LAW", "CODE", "CONSTITUTION"].includes(source.type) && (
                          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                            <p className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Organismo / tribunal</p>
                            <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{source.officialName || "Sin dato"}</p>
                          </div>
                        )}
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                          <p className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Estado del texto</p>
                          <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{source.previousText ? "Con modificatoria cargada" : "Texto vigente"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    {source.sourceUrl && (
                      <a
                        href={source.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Abrir fuente
                      </a>
                    )}
                    {source.previousText && source.content && (
                    <LegalSourceComparatorDialog
                      title={source.title}
                      country={source.country}
                      previousText={source.previousText}
                      currentText={source.officialText ?? source.content ?? ""}
                    />
                  )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDetach(source.id)}
                      disabled={pendingId === source.id}
                      className="gap-2"
                    >
                      <Unlink className="h-4 w-4" />
                      Quitar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
          <Link2 className="h-4 w-4 text-emerald-500" />
          Sugeridas para esta area
        </div>
        {suggestedSources.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-5 text-sm text-slate-500 dark:text-slate-400">
            No hay sugerencias disponibles en la biblioteca para el area {caseArea}.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {suggestedSources.map((source) => (
              <div
                key={source.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40 p-4 flex flex-col gap-4"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {source.country}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {source.area}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {sourceTypeLabel(source.type)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{source.title}</p>
                    <div className="mt-3 grid gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <p><span className="font-semibold text-slate-700 dark:text-slate-300">Numero / caratula:</span> {source.officialNumber || "Sin dato"}</p>
                      {!["LAW", "CODE", "CONSTITUTION"].includes(source.type) && (
                        <p><span className="font-semibold text-slate-700 dark:text-slate-300">Organismo / tribunal:</span> {source.officialName || "Sin dato"}</p>
                      )}
                      <p><span className="font-semibold text-slate-700 dark:text-slate-300">Estado del texto:</span> {source.previousText ? "Con modificatoria cargada" : "Texto vigente"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {source.sourceUrl && (
                    <a
                      href={source.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ver
                    </a>
                  )}
                  <Button
                    type="button"
                    onClick={() => handleAttach(source.id)}
                    disabled={pendingId === source.id}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Link2 className="h-4 w-4" />
                    Vincular
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
