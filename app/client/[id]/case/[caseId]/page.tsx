import { PdfButton } from "@/components/pdf-button";
import { EditCaseDialog } from "@/components/edit-case-dialog";
import { DeleteButton } from "@/components/delete-button";
import { CreateTransactionDialog } from "@/components/create-transaction-dialog";
import { CreateEventDialog } from "@/components/create-event-dialog";
import { CreateMovementDialog } from "@/components/create-movement-dialog";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { WhatsAppActions } from "@/components/whatsapp-actions";
import Link from "next/link";
import { GenerateDocDialog } from "@/components/generate-doc-dialog"; // 👈 IMPORTANTE: Importamos el generador

// 👇 IMPORTACIÓN UNIFICADA DE ICONOS PROFESIONALES
import { 
  Gavel, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ClipboardList, 
  Clock, 
  CalendarDays,
  AlertCircle,
  ChevronLeft,
  Mail,
  MapPin,
  FileText,
  Users,
  StickyNote,
  Zap,
  Wallet,
  AlertTriangle,
  ExternalLink
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    id: string;
    caseId: string;
  }>;
}

export default async function CasePage({ params }: PageProps) {
  const { id, caseId } = await params;

  // 1. BUSCAR DATOS EN BASE DE DATOS
  const legalCase = await db.case.findUnique({
    where: { id: caseId },
    include: {
        client: true,
        events: {
         orderBy: { date: 'asc' },
         where: { isDone: false }
      },
        movements: {
            orderBy: { date: 'desc' }
        },
        transactions: { orderBy: { date: 'desc' } } 
    }
  });

  if (!legalCase) return notFound();

  // 2. CÁLCULOS
  const totalIncome = legalCase.transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = legalCase.transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // 3. RENDERIZADO
  return (
    <div className="w-full p-6 space-y-6">
      
      {/* NAVEGACIÓN */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href={`/client/${id}`} className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Volver al Cliente
        </Link>
        <span className="text-gray-300 dark:text-gray-700">/</span>
        <span className="font-semibold text-slate-900 dark:text-slate-200">Expediente {legalCase.code}</span>
      </div>

      {/* ENCABEZADO PRINCIPAL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{legalCase.caratula}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-500 dark:text-slate-400 text-sm">
                    <span className="flex items-center gap-1.5 font-medium">
                        <Gavel className="h-4 w-4 text-blue-500" /> {legalCase.juzgado}
                    </span>
                    <span className="hidden md:inline text-slate-300 dark:text-slate-700">|</span>
                    <span className="flex items-center gap-1.5 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">
                        Nº: {legalCase.code}
                    </span>
                </div>
            </div>
            
            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                 {/* BLOQUE DE BOTONES DE DOCUMENTACIÓN */}
                 <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                     <PdfButton 
                        client={legalCase.client} 
                        legalCase={legalCase} 
                        stats={{ totalIncome, totalFee: legalCase.totalFee || 0, balance }}
                     />
                     
                     {/* 👇 ACÁ ESTÁ EL NUEVO GENERADOR DE ESCRITOS */}
                     <GenerateDocDialog 
                        client={legalCase.client} 
                        legalCase={legalCase} 
                     />
                 </div>

                 {/* BLOQUE DE EDICIÓN Y LINK */}
                 <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                     <EditCaseDialog legalCase={legalCase} />
                     
                     {legalCase.driveLink && (
                         <a 
                            href={legalCase.driveLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-md transition-all active:scale-95 w-full sm:w-auto justify-center"
                         >
                            <ExternalLink className="h-4 w-4" /> Abrir Expediente Digital
                         </a>
                     )}
                 </div>
            </div>
        </div>

        <div className="flex items-center gap-2 mt-6">
             <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase border ${
                legalCase.status === 'ACTIVE' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                legalCase.status === 'MEDIATION' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800' :
                'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
             }`}>
                {legalCase.status === 'ACTIVE' ? 'En Trámite' : legalCase.status === 'MEDIATION' ? 'Mediación' : 'Archivado'}
             </span>

             {legalCase.area && (
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-1 rounded border dark:border-slate-700 uppercase">
                    {legalCase.area}
                </span>
            )}
        </div>
      </div>

      {/* AGENDA DEL EXPEDIENTE */}
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
              <h3 className="text-red-800 dark:text-red-300 font-bold flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5" /> Próximos Vencimientos
              </h3>
              <CreateEventDialog caseId={caseId} clientId={id} />
          </div>

          {legalCase.events.length === 0 ? (
              <p className="text-sm text-red-400 italic bg-white/50 dark:bg-black/20 p-4 rounded-lg border border-dashed border-red-200 dark:border-red-900/30 text-center flex items-center justify-center gap-2">
                <CalendarDays className="h-4 w-4" /> No hay vencimientos pendientes para este caso.
              </p>
          ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {legalCase.events.map((evt) => (
                      <Card key={evt.id} className="border-l-4 border-l-red-500 shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800 relative group">
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <DeleteButton id={evt.id} type="EVENT" clientId={id} caseId={caseId} />
                          </div>
                          <CardContent className="p-4">
                              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                  {evt.type === 'HEARING' ? <Gavel className="h-3 w-3" /> : 
                                   evt.type === 'DEADLINE' ? <Zap className="h-3 w-3" /> : 
                                   <Users className="h-3 w-3" />}
                                  {evt.type === 'HEARING' ? 'Audiencia' : evt.type === 'DEADLINE' ? 'Plazo Fatal' : 'Reunión'}
                              </span>
                              <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">{evt.title}</h4>
                              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                                  <p className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3" /> {evt.date.toLocaleDateString()}</p>
                                  <p className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {evt.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} hs</p>
                              </div>
                          </CardContent>
                      </Card>
                  ))}
              </div>
          )}
      </div>

      {/* FINANZAS Y CONTACTO */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* CAJA / HONORARIOS */}
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-6 flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-emerald-800 dark:text-emerald-300 font-bold text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" /> Honorarios y Pagos
                </h3>
                <CreateTransactionDialog caseId={caseId} clientId={id} />
            </div>

            {legalCase.totalFee && legalCase.totalFee > 0 ? (
                <div className="mb-6 bg-white dark:bg-slate-900 p-5 rounded-xl border border-emerald-100 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Progreso de Cobro</span>
                        <span className="font-bold text-emerald-600">
                            {Math.round((totalIncome / legalCase.totalFee) * 100)}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mb-4 overflow-hidden">
                        <div 
                            className="bg-emerald-500 h-full transition-all duration-700 ease-out" 
                            style={{ width: `${Math.min((totalIncome / legalCase.totalFee) * 100, 100)}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between">
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Abonado</p>
                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">$ {totalIncome.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Saldo Pendiente</p>
                            <p className={`text-xl font-bold ${balance >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-red-500'}`}>
                                $ {(legalCase.totalFee - totalIncome).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg text-center text-amber-700 dark:text-amber-400 text-sm italic flex flex-col items-center gap-1">
                    <AlertTriangle className="h-5 w-5 mb-1" />
                    <span>Sin honorarios pactados. Edite el caso para cargar el presupuesto.</span>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-slate-800 overflow-hidden">
                {legalCase.transactions.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs italic flex flex-col items-center gap-2">
                        <Wallet className="h-6 w-6 opacity-30" />
                        No hay movimientos de dinero.
                    </div>
                ) : (
                    <div className="divide-y dark:divide-slate-800">
                        {legalCase.transactions.map((tx) => (
                            <div key={tx.id} className="p-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-full ${tx.type === 'INCOME' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                        {tx.type === 'INCOME' ? <TrendingUp className="h-3 w-3 text-emerald-600" /> : <TrendingDown className="h-3 w-3 text-red-600" />}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{tx.description}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-sm font-bold font-mono ${tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                        {tx.type === 'INCOME' ? '+' : '-'} ${tx.amount.toLocaleString()}
                                    </span>
                                    <DeleteButton id={tx.id} type="TRANSACTION" clientId={id} caseId={caseId} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* FICHA CLIENTE Y NOTAS */}
        <div className="space-y-6">
            <Card className="dark:bg-slate-900 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b dark:border-slate-800">
                    <h3 className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" /> Información de Contacto
                    </h3>
                </div>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-inner">
                            {legalCase.client.firstName[0]}{legalCase.client.lastName[0]}
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
                                Sin teléfono de contacto.
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

            <div className="bg-amber-50 dark:bg-slate-900 border border-amber-100 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                 <h3 className="text-amber-800 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-amber-500" /> Notas Internas
                 </h3>
                 {legalCase.description ? (
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {legalCase.description}
                    </p>
                 ) : (
                    <p className="text-xs text-slate-400 italic">No hay observaciones cargadas.</p>
                 )}
            </div>
        </div>
      </div>

      {/* LÍNEA DE TIEMPO / MOVIMIENTOS */}
      <div className="space-y-6 pt-4">
        <div className="flex justify-between items-center border-b dark:border-slate-800 pb-4">
            <h3 className="text-2xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
                <ClipboardList className="h-6 w-6 text-blue-500" /> Historia del Caso
            </h3>
            <CreateMovementDialog caseId={caseId} clientId={id} />
        </div>

        <div className="space-y-6 relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-8 pb-8">
            {legalCase.movements.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-dashed dark:border-slate-800 rounded-xl p-12 text-center text-slate-400">
                    <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="font-medium italic">El historial está vacío. Cargue el primer movimiento judicial.</p>
                </div>
            ) : (
                legalCase.movements.map((mov) => (
                    <div key={mov.id} className="relative group">
                        {/* El punto de la línea de tiempo */}
                        <div className="absolute -left-[41px] top-6 w-5 h-5 rounded-full bg-blue-500 border-4 border-white dark:border-slate-950 shadow-md transition-transform group-hover:scale-125 z-10"></div>
                        
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