"use client";

import { useState } from "react";
import { LegalSourceType } from "@prisma/client";
import { deleteLegalSource, validateManualLegalSource } from "@/lib/actions/biblioteca";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Trash2,
  Scale,
  CalendarDays,
  Landmark,
  FileText,
  Bot,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LegalSourceComparatorDialog } from "@/components/legal-source-comparator-dialog";
import { detectOfficialLegalSource } from "@/lib/legal-source-officials";

interface LegalSource {
  id: string;
  title: string;
  officialNumber: string | null;
  officialName: string | null;
  type: LegalSourceType;
  area: string;
  country: string;
  content: string;
  officialText: string | null;
  sourceUrl: string | null;
  publicationDate: Date | string | null;
  previousText: string | null;
  lastAiCheck?: Date | string | null;
}

const TYPE_LABELS: Record<LegalSourceType, string> = {
  LAW: "Ley especial",
  CODE: "Codigo",
  CONSTITUTION: "Constitucion",
  JURISPRUDENCE: "Fallo",
  OTHER: "Otra fuente",
};

export function LegalCard({ source }: { source: LegalSource }) {
  const router = useRouter();
  const hasComparison = Boolean(source.previousText);
  const officialSource = detectOfficialLegalSource(source.sourceUrl, source.country);
  const isManual = !officialSource.preferred;
  const isValidated = Boolean(source.lastAiCheck);
  const [isValidating, setIsValidating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-full">
              {source.country}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full">
              {source.area}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 px-2.5 py-1 rounded-full">
              {TYPE_LABELS[source.type]}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              isManual
                ? "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30"
                : "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30"
            }`}>
              {isManual ? "Carga manual" : "Carga automatica"}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              isValidated
                ? "text-cyan-700 bg-cyan-100 dark:text-cyan-300 dark:bg-cyan-900/30"
                : "text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800"
            }`}>
              {isValidated ? "Validado por IA" : "Sin validar"}
            </span>
            {hasComparison && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-100 dark:text-violet-300 dark:bg-violet-900/30 px-2.5 py-1 rounded-full">
                Modificatoria detectada
              </span>
            )}
          </div>
          <h4 className="font-bold text-xl text-slate-900 dark:text-white leading-tight">{source.title}</h4>
          {officialSource.recognized && (
            <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Fuente oficial: {officialSource.label}
            </p>
          )}
          <div className={`mt-4 grid gap-2 text-xs ${["LAW", "CODE", "CONSTITUTION"].includes(source.type) ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3"}`}>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
              <span className="flex items-center gap-1 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <FileText className="h-3.5 w-3.5" /> Numero
              </span>
              <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{source.officialNumber || "Sin dato"}</p>
            </div>
            {!["LAW", "CODE", "CONSTITUTION"].includes(source.type) && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                <span className="flex items-center gap-1 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Landmark className="h-3.5 w-3.5" /> Organismo
                </span>
                <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{source.officialName || "Sin dato"}</p>
              </div>
            )}
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
              <span className="flex items-center gap-1 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <CalendarDays className="h-3.5 w-3.5" /> Publicacion
              </span>
              <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                {source.publicationDate ? new Date(source.publicationDate).toLocaleDateString("es-AR") : "Sin dato"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {isManual && !isValidated && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isValidating}
              className="gap-2"
              onClick={async () => {
                setIsValidating(true);
                setFeedback(null);
                setActionError(null);
                const result = await validateManualLegalSource(source.id);
                setIsValidating(false);
                if (!result.success) {
                  setActionError(result.error);
                  router.refresh();
                  return;
                }
                setFeedback(result.message ?? "Fuente validada con IA.");
                router.refresh();
              }}
            >
              {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              Validar con IA
            </Button>
          )}
          {source.previousText && (
            <LegalSourceComparatorDialog
              title={source.title}
              country={source.country}
              previousText={source.previousText}
              currentText={source.officialText ?? source.content}
            />
          )}
          {source.sourceUrl && (
            <a
              href={source.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <button
            type="button"
            onClick={() => deleteLegalSource(source.id)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {(feedback || actionError) && (
        <div
          className={`mt-4 rounded-xl border px-3 py-2 text-sm ${
            actionError
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
          }`}
        >
          {actionError ?? feedback}
        </div>
      )}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Scale className="h-3.5 w-3.5" /> Sintesis o texto base
        </div>
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300 font-serif">
          {source.content}
        </p>
      </div>
    </article>
  );
}
