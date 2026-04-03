"use client";

import { useRef, useState } from "react";
import { LegalSourceType } from "@prisma/client";
import { createLegalSource, deleteLegalSource, validateManualLegalSource } from "@/lib/actions/biblioteca";
import { useRouter } from "next/navigation";
import {
  Search,
  Trash2,
  ExternalLink,
  Plus,
  Globe,
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

function LegalCard({ source }: { source: LegalSource }) {
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

export function BibliotecaPanel({ initialSources }: { initialSources: LegalSource[] }) {
  const [loadMode, setLoadMode] = useState<"AUTO" | "MANUAL">("AUTO");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState("TODAS");
  const [filterCountry, setFilterCountry] = useState("Argentina");
  const [filterType, setFilterType] = useState("TODOS");
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [country, setCountry] = useState("Argentina");
  const [type, setType] = useState<LegalSourceType>("LAW");
  const [entryArea, setEntryArea] = useState("CIVIL");
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [publicationDate, setPublicationDate] = useState("");
  const [officialNumber, setOfficialNumber] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
      (filterStatus === "OUTDATED" && Boolean(source.previousText)) ||
      (filterStatus === "REVIEWED" && Boolean(source.lastAiCheck)) ||
      (filterStatus === "PENDING" && !source.lastAiCheck);

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
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => {
              setLoadMode("AUTO");
              setType("LAW");
              setEntryArea("CIVIL");
              setError(null);
              setSuccessMessage(null);
            }}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              loadMode === "AUTO"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            Carga automatica
          </button>
          <button
            type="button"
            onClick={() => {
              setLoadMode("MANUAL");
              setError(null);
              setSuccessMessage(null);
            }}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              loadMode === "MANUAL"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            Carga manual
          </button>
        </div>
        <form
          ref={formRef}
          action={async (formData) => {
            setIsSaving(true);
            setError(null);
            setSuccessMessage(null);
            const result = await createLegalSource(formData);
            if (!result.success) {
              setError(result.error);
              setIsSaving(false);
              return;
            }
            formRef.current?.reset();
            setLoadMode("AUTO");
            setCountry("Argentina");
            setType("LAW");
            setEntryArea("CIVIL");
            setTitle("");
            setSourceUrl("");
            setPublicationDate("");
            setOfficialNumber("");
            setContent("");
            setSuccessMessage(result.message ?? "Fuente guardada correctamente.");
            setIsSaving(false);
          }}
          className="space-y-4"
        >
          <input type="hidden" name="loadMode" value={loadMode} />
          {loadMode === "AUTO" && (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-500">Jurisdiccion / Pais <span className="text-red-500">*</span></label>
                <select
                  required
                  name="country"
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  className="w-full mt-1 p-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm font-medium"
                >
                  <option value="Argentina">Argentina</option>
                  <option value="Paraguay">Paraguay</option>
                </select>
              </div>
              <input type="hidden" name="type" value={type} />
              <input type="hidden" name="area" value={entryArea} />
            </>
          )}
          {loadMode === "MANUAL" && (
            <div>
              <label className="text-xs font-semibold text-gray-500">Jurisdiccion / Pais <span className="text-red-500">*</span></label>
              <select
                required
                name="country"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                className="w-full mt-1 p-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm font-medium"
              >
                <option value="Argentina">Argentina</option>
                <option value="Paraguay">Paraguay</option>
              </select>
            </div>
          )}

          {loadMode === "MANUAL" && (
            <div>
              <label className="text-xs font-semibold text-gray-500">Titulo / Caratula <span className="text-red-500">*</span></label>
              <input
                required
                name="title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full mt-1 p-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm"
                placeholder="Ej: Fallo 'Halabi' o Ley N..."
              />
            </div>
          )}

          {loadMode === "MANUAL" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-500">Tipo <span className="text-red-500">*</span></label>
                <select
                  required
                  name="type"
                  value={type}
                  onChange={(event) => setType(event.target.value as LegalSourceType)}
                  className="w-full mt-1 p-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm"
                >
                  <option value="LAW">Ley especial</option>
                  <option value="CODE">Codigo</option>
                  <option value="JURISPRUDENCE">Fallo</option>
                  <option value="CONSTITUTION">Constitucion</option>
                  <option value="OTHER">Otra fuente</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Materia <span className="text-red-500">*</span></label>
                <select
                  required
                  name="area"
                  value={entryArea}
                  onChange={(event) => setEntryArea(event.target.value)}
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
          )}

          {loadMode === "MANUAL" && (
            <div>
              <label className="text-xs font-semibold text-gray-500">
                {type === "JURISPRUDENCE" ? "Caratula / identificacion (opcional)" : "Numero oficial (opcional)"}
              </label>
              <input
                name="officialNumber"
                type="text"
                value={officialNumber}
                onChange={(event) => setOfficialNumber(event.target.value)}
                className="w-full mt-1 p-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm"
                placeholder={
                  type === "JURISPRUDENCE"
                    ? "Ej: Acuerdo y Sentencia 52/2024"
                    : country === "Paraguay"
                      ? "Ej: 213/93"
                      : "Ej: 11179"
                }
              />
            </div>
          )}

          {loadMode === "MANUAL" && (
            <div>
              <label className="text-xs font-semibold text-gray-500">Fecha de publicacion (opcional)</label>
              <input
                name="publicationDate"
                type="date"
                value={publicationDate}
                onChange={(event) => setPublicationDate(event.target.value)}
                className="w-full mt-1 p-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm"
              />
            </div>
          )}

          {loadMode === "AUTO" && (
            <div>
              <label className="text-xs font-semibold text-gray-500">Link oficial <span className="text-red-500">*</span></label>
              <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                {country === "Argentina"
                  ? "En la carga automatica solo hace falta pegar el link oficial de InfoLEG. El sistema completa titulo, sintesis, numero, tipo y materia desde esa fuente."
                  : "En la carga automatica solo hace falta pegar el link oficial de la Base de Legislacion Paraguaya / CSJ - IIJ u otra fuente oficial valida de Paraguay. El sistema completa la ficha desde esa fuente."}
              </p>
              <input
                required
                name="sourceUrl"
                type="url"
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                className="w-full mt-1 p-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm"
                placeholder="https://..."
              />
            </div>
          )}

          {loadMode === "MANUAL" && (
            <div>
              <label className="text-xs font-semibold text-gray-500">Texto vigente / extracto principal <span className="text-red-500">*</span></label>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                En carga manual, este texto es obligatorio. Despues de guardar podes usar &quot;Validar con IA&quot; desde la ficha para completar y ajustar la informacion.
              </p>
              <textarea
                name="content"
                required
                rows={4}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="w-full mt-1 p-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm resize-none"
                placeholder="Pega aca el texto vigente o el extracto principal de la fuente."
              />
            </div>
          )}

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar en Biblioteca"}
          </Button>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
              {successMessage}
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
              <option value="LAW">Ley especial</option>
              <option value="CODE">Codigo</option>
              <option value="JURISPRUDENCE">Fallo</option>
              <option value="CONSTITUTION">Constitucion</option>
              <option value="OTHER">Otra fuente</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 dark:text-white outline-none text-sm"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="OUTDATED">Con modificatoria</option>
              <option value="REVIEWED">Con fuente oficial</option>
              <option value="PENDING">Solo texto vigente</option>
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
