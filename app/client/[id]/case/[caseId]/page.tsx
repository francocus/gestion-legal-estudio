import { EditCaseDialog } from "@/components/edit-case-dialog";
import { DeleteButton } from "@/components/delete-button";
import { CreateTransactionDialog } from "@/components/create-transaction-dialog";
import { CreateEventDialog } from "@/components/create-event-dialog";
import { CreateMovementDialog } from "@/components/create-movement-dialog";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";


export const dynamic = "force-dynamic"; // ⚠️ Obligatorio para ver datos frescos

interface PageProps {
  params: Promise<{
    id: string;      // ID del Cliente
    caseId: string;  // ID del Juicio
  }>;
}

export default async function CasePage({ params }: PageProps) {
  const { id, caseId } = await params;

  // Buscamos el juicio y sus movimientos ordenados por fecha (del más nuevo al más viejo)
  const legalCase = await db.case.findUnique({
    where: { id: caseId },
    include: { 
        events: {
         orderBy: { date: 'asc' }, // Ordenar por fecha (lo más próximo primero)
         where: { isDone: false }  // Solo traer lo pendiente
      },
        movements: {
            orderBy: { date: 'desc' }
        },
       transactions: { orderBy: { date: 'desc' } } 
    }
  });

  if (!legalCase) return notFound();

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-6">
      
      {/* NAVEGACIÓN */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href={`/client/${id}`} className="hover:text-black hover:underline">
            ← Volver al Cliente
        </Link>
        <span>/</span>
        <span className="font-semibold text-black">Expediente {legalCase.code}</span>
      </div>

      {/* ENCABEZADO DEL JUICIO CON EDICIÓN */}
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
            <div className="w-full">
                <div className="flex justify-between items-start w-full">
                    <h1 className="text-3xl font-bold text-gray-900 leading-tight">{legalCase.caratula}</h1>
                    {/* Botón de Editar */}
                    <EditCaseDialog legalCase={legalCase} />
                </div>
                <p className="text-gray-500 mt-2 flex items-center gap-2">
                    🏛️ {legalCase.juzgado} 
                    <span className="text-gray-300">|</span> 
                     Expte Nº: {legalCase.code}
                </p>
            </div>
        </div>

        {/* Badge de Estado (Ahora se actualiza si lo cambiás) */}
        <div className="flex items-center gap-2">
             <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase border ${
                legalCase.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                legalCase.status === 'MEDIATION' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                'bg-gray-100 text-gray-800 border-gray-200'
             }`}>
                {legalCase.status === 'ACTIVE' ? 'En Trámite' : legalCase.status === 'MEDIATION' ? 'Mediación' : 'Archivado'}
             </span>
        </div>
      </div>

      {/* SECCIÓN AGENDA (NUEVA) */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-3 bg-red-50 border border-red-100 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-red-800 font-bold flex items-center gap-2 text-lg">
                    ⏰ Próximos Vencimientos
                </h3>
                <CreateEventDialog caseId={caseId} clientId={id} />
            </div>

            {legalCase.events.length === 0 ? (
                <p className="text-sm text-red-400 italic">No hay vencimientos pendientes.</p>
            ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
    {legalCase.events.map((evt) => (
        <Card key={evt.id} className="border-l-4 border-l-red-500 shadow-sm bg-white relative group">
            
            {/* BOTÓN DE BORRAR (Flotando oculto) */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <DeleteButton 
                    id={evt.id} 
                    type="EVENT" 
                    clientId={id} 
                    caseId={caseId} 
                />
            </div>

            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-red-700 text-sm uppercase pr-6">
                        {evt.type === 'DEADLINE' ? '⚡ Vencimiento' : evt.type === 'HEARING' ? '⚖️ Audiencia' : 'Reunión'}
                    </span>
                </div>
                <h4 className="font-bold mb-1">{evt.title}</h4>
                <div className="text-sm text-gray-600 mb-2">
                    📅 {evt.date.toLocaleDateString()} <br/>
                    🕒 {evt.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} hs
                </div>
            </CardContent>
        </Card>
    ))}
</div>
            )}
        </div>
      </div>

      {/* SECCIÓN FINANZAS */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* RESUMEN DE CAJA */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-green-800 font-bold text-lg">💰 Caja del Expediente</h3>
                <CreateTransactionDialog caseId={caseId} clientId={id} />
            </div>

            <div className="bg-white rounded-lg border shadow-sm p-0 overflow-hidden">
    {legalCase.transactions.length === 0 ? (
        <div className="p-4 text-center text-gray-400 text-sm">No hay movimientos de dinero.</div>
    ) : (
        <table className="w-full text-sm">
            <tbody>
                {legalCase.transactions.map((tx) => (
                    <tr key={tx.id} className="border-b last:border-0 hover:bg-gray-50 group">
                        <td className="p-3 text-gray-600">{tx.description}</td>
                        <td className={`p-3 text-right font-bold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-500'}`}>
                            {tx.type === 'INCOME' ? '+' : '-'} ${tx.amount}
                        </td>
                        
                        {/* CELDA DEL BOTÓN DE BORRAR (Aparece al pasar el mouse) */}
                        <td className="p-2 w-10 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                             <DeleteButton 
                                id={tx.id} 
                                type="TRANSACTION" 
                                clientId={id} 
                                caseId={caseId} 
                             />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )}
</div>
        </div>

        {/* ACÁ PODÉS DEJAR LA AGENDA SI QUERÉS QUE ESTÉN LADO A LADO, 
            O SI LA AGENDA YA ESTÁ ARRIBA, ESTO QUEDA ABAJO. 
            POR AHORA PROBALO ASÍ QUE SE VA A PONER DEBAJO DE LA AGENDA. */}
      </div>

      {/* SECCIÓN DE MOVIMIENTOS */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2">
                📜 Historia del Expediente
            </h3>
            <CreateMovementDialog caseId={caseId} clientId={id} />
        </div>

        {/* LÍNEA DE TIEMPO */}
        <div className="space-y-4 relative border-l-2 border-gray-200 ml-3 pl-6 pb-2">
    
    {legalCase.movements.length === 0 ? (
        <div className="bg-gray-50 border border-dashed rounded-lg p-8 text-center text-gray-500">
            <p>No hay movimientos cargados todavía.</p>
            <p className="text-sm">Usá el botón para registrar la primera novedad.</p>
        </div>
    ) : (
        legalCase.movements.map((mov) => (
            <Card key={mov.id} className="relative mb-4 hover:shadow-md transition-shadow group">
                
                {/* BOTÓN DE BORRAR (Flotando oculto) */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <DeleteButton 
                        id={mov.id} 
                        type="MOVEMENT" 
                        clientId={id} 
                        caseId={caseId} 
                    />
                </div>

                {/* Puntito en la línea de tiempo */}
                <div className="absolute -left-[33px] top-6 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div>
                
                <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        {/* pr-8 deja espacio para que el texto no toque el botón de borrar */}
                        <h4 className="font-bold text-lg pr-8">{mov.title}</h4>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                            {mov.date.toLocaleDateString()}
                        </span>
                    </div>
                    {mov.description && (
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">
                            {mov.description}
                        </p>
                    )}
                </CardContent>
            </Card>
        ))
    )}

</div>
      </div>
    </div>
  );
}