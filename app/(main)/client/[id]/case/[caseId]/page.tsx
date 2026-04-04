import { PdfButton } from "@/components/pdf-button";
import { EditCaseDialog } from "@/components/edit-case-dialog";
import { DeleteButton } from "@/components/delete-button";
import { CreateEventDialog } from "@/components/create-event-dialog";
import { CreateMovementDialog } from "@/components/create-movement-dialog";
import { CaseNotesPanel } from "@/components/case-notes-panel";
import { CaseLegalSourcesPanel } from "@/components/case-legal-sources-panel";
import { AccountingPanel } from "@/components/accounting-panel";
import { CaseAiTools } from "@/components/case-ai-tools";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WhatsAppActions } from "@/components/whatsapp-actions";
import { deleteCaseDocument, uploadCaseDocuments } from "@/lib/actions/cases";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import {
  Gavel,
  DollarSign,
  ClipboardList,
  Clock,
  CalendarDays,
  AlertCircle,
  ChevronLeft,
  Mail,
  MapPin,
  Users,
  StickyNote,
  Zap,
  ExternalLink,
  NotebookPen,
  BriefcaseBusiness,
  FileClock,
  Scale,
  Wallet,
  Paperclip,
  Upload,
  FileText,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    id: string;
    caseId: string;
  }>;
}

type CasePagePayload = Prisma.CaseGetPayload<{
  include: {
    client: true;
    events: {
      where: { isDone: false };
      orderBy: { date: "asc" };
    };
    movements: {
      orderBy: { date: "desc" };
      include: {
        documents: {
          orderBy: { uploadedAt: "desc" };
        };
      };
    };
    documents: {
      orderBy: { uploadedAt: "desc" };
    };
    notes: {
      orderBy: { createdAt: "desc" };
    };
    legalSources: {
      include: { legalSource: true };
      orderBy: { createdAt: "desc" };
    };
  };
}>;

export default async function CasePage({ params }: PageProps) {
  const { id, caseId } = await params;

  const legalCase: CasePagePayload | null = await db.case.findUnique({
    where: { id: caseId },
    include: {
      client: true,
      events: {
        orderBy: { date: "asc" },
        where: { isDone: false },
      },
      movements: {
        orderBy: { date: "desc" },
        include: {
          documents: {
            orderBy: { uploadedAt: "desc" },
          },
        },
      },
      documents: {
        orderBy: { uploadedAt: "desc" },
      },
      notes: { orderBy: { createdAt: "desc" } },
      legalSources: {
        include: {
          legalSource: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!legalCase) return notFound();

  const movimientosDelCaso = await db.accountEntry.findMany({
    where: { caseId },
    orderBy: { date: "desc" },
  });

  const linkedSourceIds = legalCase.legalSources.map((item: CasePagePayload["legalSources"][number]) => item.legalSourceId);
  const suggestedLegalSources = await db.legalSource.findMany({
    where: {
      area: legalCase.area,
      id: {
        notIn: linkedSourceIds.length > 0 ? linkedSourceIds : undefined,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });

  const totalIncome = movimientosDelCaso.reduce((sum, item) => sum + (item.haber || 0), 0);
  const totalExpense = movimientosDelCaso.reduce((sum, item) => sum + (item.debe || 0), 0);
  const balance = totalIncome - totalExpense;
  const nextEvent = legalCase.events[0] ?? null;
  const latestMovement = legalCase.movements[0] ?? null;
  const lastActivityDate = latestMovement?.date ?? nextEvent?.date ?? legalCase.createdAt;
  const pendingFee = Math.max((legalCase.totalFee || 0) - totalIncome, 0);

  return (
    <div className="w-full p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
        <Link href={`/client/${id}`} className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <ChevronLeft className="h-4 w-4" /> Volver al cliente
        </Link>
        <span className="text-slate-300 dark:text-slate-700">/</span>
        <span className="font-semibold text-slate-900 dark:text-slate-200">Expediente {legalCase.code}</span>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{legalCase.caratula}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-500 dark:text-slate-400 text-sm">
              {legalCase.juzgado && (
                <>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Gavel className="h-4 w-4 text-blue-500" /> {legalCase.juzgado}
                  </span>
                  <span className="hidden md:inline text-slate-300 dark:text-slate-700">|</span>
                </>
              )}
              <span className="flex items-center gap-1.5 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">
                Nro: {legalCase.code || "Sin numero"}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 w-full md:w-auto">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
              <PdfButton
                client={legalCase.client}
                legalCase={legalCase}
                stats={{ totalIncome, totalFee: legalCase.totalFee || 0, balance }}
              />
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
              <EditCaseDialog legalCase={legalCase} />
              {legalCase.driveLink && (
                <a
                  href={legalCase.driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-md transition-all active:scale-95 w-full sm:w-auto justify-center"
                >
                  <ExternalLink className="h-4 w-4" /> Abrir expediente digital
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-6">
          <span
            className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase border ${
              legalCase.status === "ACTIVE"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                : legalCase.status === "MEDIATION"
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            }`}
          >
            {legalCase.status === "ACTIVE" ? "En tramite" : legalCase.status === "MEDIATION" ? "Mediacion" : "Archivado"}
          </span>
          {legalCase.area && (
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-1 rounded border dark:border-slate-700 uppercase">
              {legalCase.area}
            </span>
          )}
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-1 rounded border dark:border-slate-700 uppercase">
            {legalCase.isExtrajudicial ? "Extrajudicial" : "Judicial"}
          </span>
        </div>

        <div className="grid gap-3 mt-6 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Cliente</p>
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
              {legalCase.client.lastName}, {legalCase.client.firstName}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {legalCase.isExtrajudicial ? "Gestion" : "Juzgado"}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
              {legalCase.juzgado || "Sin dato"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Numero</p>
            <p className="mt-2 text-sm font-semibold font-mono text-slate-900 dark:text-white">
              {legalCase.code || "Sin numero"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Proximo hito</p>
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
              {nextEvent ? nextEvent.title : "Sin vencimientos pendientes"}
            </p>
            {nextEvent && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {nextEvent.date.toLocaleDateString("es-AR")} · {nextEvent.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} hs
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Actividad reciente</p>
                <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                  {latestMovement ? latestMovement.title : "Sin movimientos recientes"}
                </p>
              </div>
              <div className="rounded-xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Ultima referencia: {lastActivityDate.toLocaleDateString("es-AR")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Agenda activa</p>
                <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{legalCase.events.length} pendientes</p>
              </div>
              <div className="rounded-xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                <FileClock className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              {nextEvent ? `Siguiente: ${nextEvent.title}` : "No hay vencimientos inmediatos."}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Biblioteca y notas</p>
                <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                  {legalCase.legalSources.length} fuentes · {legalCase.notes.length} notas
                </p>
              </div>
              <div className="rounded-xl bg-violet-100 p-3 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                <Scale className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              {legalCase.legalSources.length > 0 ? "El caso ya tiene sustento juridico vinculado." : "Conviene vincular fuentes juridicas a este caso."}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Honorarios del caso</p>
                <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                  ${(legalCase.totalFee || 0).toLocaleString("es-AR")}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Cobrado: ${totalIncome.toLocaleString("es-AR")} · Pendiente: ${pendingFee.toLocaleString("es-AR")}
            </p>
          </CardContent>
        </Card>
      </div>

      <CaseAiTools
        caseId={legalCase.id}
        clientId={id}
        caratula={legalCase.caratula}
        area={legalCase.area}
        description={legalCase.description || ""}
        notes={legalCase.notes.map((note: CasePagePayload["notes"][number]) => note.content)}
        legalSources={legalCase.legalSources.map((item: CasePagePayload["legalSources"][number]) => ({
          title: item.legalSource.title,
          type: item.legalSource.type,
          area: item.legalSource.area,
          country: item.legalSource.country,
        }))}
        defaultCountry={legalCase.legalSources[0]?.legalSource.country || "Argentina"}
      />

      <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-red-800 dark:text-red-300 font-bold flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5" /> Proximos vencimientos
          </h3>
          <CreateEventDialog caseId={caseId} clientId={id} />
        </div>

        {legalCase.events.length === 0 ? (
          <p className="text-sm text-red-400 italic bg-white/50 dark:bg-black/20 p-4 rounded-lg border border-dashed border-red-200 dark:border-red-900/30 text-center flex items-center justify-center gap-2">
            <CalendarDays className="h-4 w-4" /> No hay vencimientos pendientes para este caso.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {legalCase.events.map((evt: CasePagePayload["events"][number]) => (
              <Card key={evt.id} className="border-l-4 border-l-red-500 shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800 relative group">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <DeleteButton id={evt.id} type="EVENT" clientId={id} caseId={caseId} />
                </div>
                <CardContent className="p-4">
                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    {evt.type === "HEARING" ? <Gavel className="h-3 w-3" /> : evt.type === "DEADLINE" ? <Zap className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                    {evt.type === "HEARING" ? "Audiencia" : evt.type === "DEADLINE" ? "Plazo fatal" : "Reunion"}
                  </span>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">{evt.title}</h4>
                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <p className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3" /> {evt.date.toLocaleDateString()}</p>
                    <p className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {evt.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} hs</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="dark:bg-slate-900 dark:border-slate-800 overflow-hidden shadow-sm h-full">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b dark:border-slate-800">
            <h3 className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <Users className="h-3.5 w-3.5" /> Informacion de contacto
            </h3>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-inner">
                {legalCase.client.firstName[0]}
                {legalCase.client.lastName[0]}
              </div>
              <div>
                <p className="font-bold text-xl text-slate-900 dark:text-white">
                  {legalCase.client.lastName}, {legalCase.client.firstName}
                </p>
                <p className="text-xs text-slate-500 font-mono">DNI: {legalCase.client.dni || "---"}</p>
              </div>
            </div>

            <div className="space-y-4">
              {legalCase.client.phone ? (
                <WhatsAppActions client={legalCase.client} legalCase={legalCase} />
              ) : (
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 text-xs italic border border-dashed border-slate-200 dark:border-slate-700">
                  Sin telefono de contacto.
                </div>
              )}

              <div className="grid gap-3 text-sm border-t dark:border-slate-800 pt-4">
                {legalCase.client.email && (
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg truncate">
                    <Mail className="h-4 w-4 text-blue-500 shrink-0" /> {legalCase.client.email}
                  </div>
                )}
                {legalCase.client.address && (
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                    <MapPin className="h-4 w-4 text-red-500 shrink-0" /> {legalCase.client.address}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-amber-50 dark:bg-slate-900 border border-amber-100 dark:border-slate-800 rounded-xl p-6 shadow-sm h-full">
          <h3 className="text-amber-800 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-amber-500" /> Descripcion del caso
          </h3>
          {legalCase.description ? (
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{legalCase.description}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">No hay descripcion detallada guardada para este expediente.</p>
          )}
        </div>
      </div>

      <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <DollarSign className="h-6 w-6 text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 p-1 rounded-md" />
            Caja chica y honorarios
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestion financiera exclusiva de este expediente. Estos montos impactan automaticamente en el resumen contable general.
          </p>
        </div>

        <AccountingPanel initialEntries={movimientosDelCaso} caseId={caseId} showCaseColumn={false} />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 border-b dark:border-slate-800 pb-4">
          <NotebookPen className="h-6 w-6 text-amber-500" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Notas e ideas</h3>
          <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">
            {legalCase.notes.length}
          </span>
        </div>
        <CaseNotesPanel caseId={legalCase.id} clientId={id} initialNotes={legalCase.notes} />
      </div>

      <CaseLegalSourcesPanel
        caseId={legalCase.id}
        clientId={id}
        caseArea={legalCase.area}
        linkedSources={legalCase.legalSources.map((item) => item.legalSource)}
        suggestedSources={suggestedLegalSources}
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
              <FileText className="h-6 w-6 text-blue-500" /> Documentos del expediente
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Adjunta PDFs generales del caso sin necesidad de crear un movimiento nuevo.
            </p>
          </div>

          <form action={uploadCaseDocuments} className="w-full max-w-xl rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <input type="hidden" name="caseId" value={caseId} />
            <input type="hidden" name="clientId" value={id} />
            <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Adjuntar PDFs <span className="text-red-500">*</span>
            </label>
            <input
              name="documents"
              type="file"
              accept="application/pdf"
              multiple
              className="mt-3 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Puedes sumar uno o varios PDFs para ir armando el expediente digital del caso.
            </p>
            <Button type="submit" className="mt-4 w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4" /> Subir al expediente
            </Button>
          </form>
        </div>

        {legalCase.documents.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-950/30">
            Todavia no hay PDFs generales cargados en este expediente.
          </div>
        ) : (
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {legalCase.documents.map((document: CasePagePayload["documents"][number]) => (
              <div
                key={document.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <a
                  href={document.filePath}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      <Paperclip className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 hover:text-blue-700 dark:text-white dark:hover:text-blue-300">
                        {document.fileName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Cargado el {document.uploadedAt.toLocaleDateString("es-AR")}
                      </p>
                    </div>
                  </div>
                </a>

                <form action={deleteCaseDocument}>
                  <input type="hidden" name="id" value={document.id} />
                  <input type="hidden" name="caseId" value={caseId} />
                  <input type="hidden" name="clientId" value={id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon-xs"
                    className="text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                    title="Eliminar documento"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6 pt-4">
        <div className="flex justify-between items-center border-b dark:border-slate-800 pb-4">
          <h3 className="text-2xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
            <ClipboardList className="h-6 w-6 text-blue-500" /> Historia del caso
          </h3>
          <CreateMovementDialog caseId={caseId} clientId={id} />
        </div>

        <div className="space-y-6 relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-8 pb-8">
          {legalCase.movements.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-dashed dark:border-slate-800 rounded-xl p-12 text-center text-slate-400">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium italic">El historial esta vacio. Cargue el primer movimiento judicial.</p>
            </div>
          ) : (
            legalCase.movements.map((mov: CasePagePayload["movements"][number]) => (
              <div key={mov.id} className="relative group">
                <div className="absolute -left-[41px] top-6 w-5 h-5 rounded-full bg-blue-500 border-4 border-white dark:border-slate-950 shadow-md transition-transform group-hover:scale-125 z-10" />

                <Card className="hover:shadow-lg transition-all dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
                  <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 px-5 py-3 border-b dark:border-slate-800">
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> {mov.date.toLocaleDateString()}
                    </span>
                    <DeleteButton id={mov.id} type="MOVEMENT" clientId={id} caseId={caseId} />
                  </div>
                  <CardContent className="p-5">
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-3">{mov.title}</h4>
                    {mov.description && (
                      <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed border-l-2 border-slate-100 dark:border-slate-800 pl-4">
                        {mov.description}
                      </p>
                    )}
                    {mov.documents.length > 0 && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          <Paperclip className="h-3.5 w-3.5 text-blue-500" />
                          Documentos adjuntos
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {mov.documents.map((document: CasePagePayload["movements"][number]["documents"][number]) => (
                            <a
                              key={document.id}
                              href={document.filePath}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              <Paperclip className="h-4 w-4" />
                              {document.fileName}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
