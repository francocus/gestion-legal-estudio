"use client";

import { useRef, useState } from "react";
import { LegalSourceType } from "@prisma/client";
import { createLegalSource, deleteLegalSource } from "@/lib/actions/biblioteca";
import {
  Search,
  Trash2,
  ExternalLink,
  Plus,
  Bot,
  Globe,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LegalSourceComparatorDialog } from "@/components/legal-source-comparator-dialog";
import { detectOfficialLegalSource } from "@/lib/legal-source-officials";

interface LegalSource {
  id: string;
  title: string;
  type: LegalSourceType;
  area: string;
  country: string;
  content: string;
  sourceUrl: string | null;
  publicationDate: Date | string | null;
  lastAiCheck: Date | string | null;
  isOutdated: boolean;
  previousText: string | null;
}

const TYPE_LABELS: Record<LegalSourceType, string> = {
  LAW: "Ley",
  CODE: "Codigo",
  CONSTITUTION: "Constitucion",
  JURISPRUDENCE: "Jurisprudencia",
  OTHER: "Otro",
};

function getReviewStatus(source: LegalSource) {
  if (source.isOutdated) {
    return {
      label: source.sourceUrl ? "Revisar vigencia o cambios" : "Contenido a revisar",
      className: "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30",
    };
  }

  if (source.lastAiCheck && source.sourceUrl) {
    return {
      label: "Verificado con fuente oficial",
      className: "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30",
    };
  }

  if (source.lastAiCheck) {
    return {
      label: "Analisis de consistencia IA",
      className: "text-sky-700 bg-sky-100 dark:text-sky-300 dark:bg-sky-900/30",
    };
  }

  return {
    label: "Sin analisis IA",
    className: "text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800",
  };
}

function LegalCard({ source }: { source: LegalSource }) {
  const [showDiff, setShowDiff] = useState(false);
  const reviewStatus = getReviewStatus(source);
  const officialSource = detectOfficialLegalSource(source.sourceUrl, source.country);

  return (
    <div
      className={`p-5 rounded-xl border shadow-sm flex flex-col gap-3 group transition-all duration-300 ${
        source.isOutdated
          ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/50"
          : "bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800"
      }`}
    >
      {source.isOutdated && (
        <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300 text-xs font-bold px-3 py-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-amber-200 dark:border-amber-800/50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            <span>ATENCION: la IA detecto una modificatoria en esta norma</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDiff(!showDiff)}
            className="h-8 text-xs border-amber-400 hover:bg-amber-200 dark:border-amber-700 dark:hover:bg-amber-800 w-full sm:w-auto"
          >
            {showDiff ? "Ocultar analisis" : "Ver analisis IA"}
          </Button>
        </div>
      )}

      <div className="flex justify-between items-start gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-full">
              {source.country}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
              {source.area}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
              {TYPE_LABELS[source.type]}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${reviewStatus.className}`}>
              {reviewStatus.label}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Bot className="h-3 w-3" /> IA
            </span>
          </div>
          <h4 className="font-bold text-lg dark:text-white leading-tight">{source.title}</h4>
          <div className="mt-1 space-y-1">
            {source.publicationDate && (
              <p className="text-[10px] text-gray-400">
                Publicacion: {new Date(source.publicationDate).toLocaleDateString("es-AR")}
              </p>
            )}
            {source.lastAiCheck && (
              <p className="text-[10px] text-gray-400">
                Ultima revision IA: {new Date(source.lastAiCheck).toLocaleDateString("es-AR")}
              </p>
            )}
            {officialSource.label && (
              <p className="text-[10px] text-emerald-500 dark:text-emerald-400">
                Fuente oficial: {officialSource.label}
              </p>
            )}
            {!source.sourceUrl && (
              <p className="text-[10px] text-amber-500 dark:text-amber-400">
                Sin link oficial, la vigencia no fue verificada.
              </p>
            )}
            {source.sourceUrl && !officialSource.recognized && (
              <p className="text-[10px] text-amber-500 dark:text-amber-400">
                Link externo cargado. La verificacion fuerte de vigencia se recomienda con fuente oficial.
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {source.previousText && (
            <LegalSourceComparatorDialog
              title={source.title}
              country={source.country}
              previousText={source.previousText}
              currentText={source.content}
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

      {!showDiff && (
        <div
          className={`p-4 rounded-lg border ${
            source.isOutdated
              ? "bg-white/50 dark:bg-slate-900/50 border-amber-100 dark:border-amber-900/30"
              : "bg-gray-50 dark:bg-slate-900 border-gray-100 dark:border-slate-800"
          }`}
        >
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-serif leading-relaxed">
            {source.content}
          </p>
        </div>
      )}

      {showDiff && source.isOutdated && (
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-amber-200 dark:border-amber-800/50 pt-4 animate-in fade-in slide-in-from-top-2">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900/50">
            <h5 className="text-red-700 dark:text-red-400 font-bold text-xs flex items-center gap-1 mb-3">
              <XCircle className="h-4 w-4" /> Texto anterior
            </h5>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-through opacity-80 font-serif">
              {source.previousText}
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-900/50 shadow-sm">
            <h5 className="text-green-700 dark:text-green-400 font-bold text-xs flex items-center gap-1 mb-3">
              <Bot className="h-4 w-4" /> Ficha oficial analizada
            </h5>
            <p className="text-sm text-gray-800 dark:text-gray-200 font-medium font-serif">
              {source.content}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function BibliotecaPanel({ initialSources }: { initialSources: LegalSource[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState("TODAS");
  const [filterCountry, setFilterCountry] = useState("Argentina");
  const [filterType, setFilterType] = useState("TODOS");
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const filteredSources = initialSources.filter((source) => {
    const matchesSearch =
      source.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = filterArea === "TODAS" || source.area === filterArea;
    const matchesCountry = source.country === filterCountry;
    const matchesType = filterType === "TODOS" || source.type === filterType;
    const matchesStatus =
      filterStatus === "TODOS" ||
      (filterStatus === "OUTDATED" && source.isOutdated) ||
      (filterStatus === "REVIEWED" && !source.isOutdated && Boolean(source.lastAiCheck)) ||
      (filterStatus === "PENDING" && !source.isOutdated && !source.lastAiCheck);

    return matchesSearch && matchesArea && matchesCountry && matchesType && matchesStatus;
  });

  const currentCountryLabel = filterCountry === "Paraguay" ? "Paraguay" : "Argentina";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1 bg-white dark:bg-slate-950 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm h-fit">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white">
          <Plus className="h-5 w-5 text-indigo-500" />
          Nueva Fuente
        </h3>
        <form
          ref={formRef}
          action={async (formData) => {
            setIsSaving(true);
            setError(null);
            const result = await createLegalSource(formData);
            if (!result.success) {
              setError(result.error);
              setIsSaving(false);
              return;
            }
            formRef.current?.reset();
            setIsSaving(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-semibold text-gray-500">Jurisdiccion / Pais</label>
            <select
              required
              name="country"
              defaultValue="Argentina"
              className="w-full mt-1 p-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm font-medium"
            >
              <option value="Argentina">Argentina</option>
              <option value="Paraguay">Paraguay</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500">Titulo / Caratula</label>
            <input
              required
              name="title"
              type="text"
              className="w-full mt-1 p-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm"
              placeholder="Ej: Fallo 'Halabi' o Ley N..."
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-gray-500">Tipo</label>
              <select
                required
                name="type"
                className="w-full mt-1 p-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm"
              >
                <option value="LAW">Ley</option>
                <option value="CODE">Codigo</option>
                <option value="JURISPRUDENCE">Jurisprudencia</option>
                <option value="CONSTITUTION">Constitucion</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Materia</label>
              <select
                required
                name="area"
                className="w-full mt-1 p-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm"
              >
                <option value="CIVIL">Civil</option>
                <option value="PENAL">Penal</option>
                <option value="LABORAL">Laboral</option>
                <option value="COMERCIAL">Comercial</option>
                <option value="CONSTITUCIONAL">Constitucional</option>
                <option value="ADMINISTRATIVO">Administrativo</option>
                <option value="TRIBUTARIO">Tributario</option>
                <option value="FAMILIA">Familia</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500">Fecha de publicacion (opcional)</label>
            <input
              name="publicationDate"
              type="date"
              className="w-full mt-1 p-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500">Link oficial (opcional)</label>
            <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
              Argentina: usa InfoLEG. Paraguay: usa la base oficial del Poder Judicial o la fuente legislativa oficial. Asi la IA puede verificar mejor la vigencia.
            </p>
            <input
              name="sourceUrl"
              type="url"
              className="w-full mt-1 p-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500">Texto / Extracto</label>
            <textarea
              required
              name="content"
              rows={4}
              className="w-full mt-1 p-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm resize-none"
              placeholder="Pega aca el texto de la ley o doctrina..."
            />
          </div>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar en Biblioteca"}
          </Button>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}
        </form>
      </div>

      <div className="lg:col-span-3 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-950 p-3 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por articulo, ley o palabras clave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 p-2 bg-transparent dark:text-white outline-none"
            />
          </div>
          <div className="flex gap-2 border-t sm:border-t-0 sm:border-l border-gray-200 dark:border-slate-800 pt-3 sm:pt-0 sm:pl-3">
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="p-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 dark:text-white outline-none text-sm font-medium"
            >
              <option value="Argentina">Argentina</option>
              <option value="Paraguay">Paraguay</option>
            </select>
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="p-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 dark:text-white outline-none text-sm"
            >
              <option value="TODAS">Todas las materias</option>
              <option value="CIVIL">Civil</option>
              <option value="PENAL">Penal</option>
              <option value="LABORAL">Laboral</option>
              <option value="COMERCIAL">Comercial</option>
              <option value="CONSTITUCIONAL">Constitucional</option>
              <option value="ADMINISTRATIVO">Administrativo</option>
              <option value="TRIBUTARIO">Tributario</option>
              <option value="FAMILIA">Familia</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="p-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 dark:text-white outline-none text-sm"
            >
              <option value="TODOS">Todos los tipos</option>
              <option value="LAW">Ley</option>
              <option value="CODE">Codigo</option>
              <option value="JURISPRUDENCE">Jurisprudencia</option>
              <option value="CONSTITUTION">Constitucion</option>
              <option value="OTHER">Otro</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 dark:text-white outline-none text-sm"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="OUTDATED">Cambios detectados por IA</option>
              <option value="REVIEWED">Controlado por IA</option>
              <option value="PENDING">Sin analisis IA</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredSources.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-950 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
              <Globe className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No se encontraron fuentes para {currentCountryLabel} con esos filtros.
              </p>
            </div>
          ) : (
            filteredSources.map((source) => <LegalCard key={source.id} source={source} />)
          )}
        </div>
      </div>
    </div>
  );
}
