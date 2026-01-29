import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CreateCaseDialog } from "@/components/create-case-dialog";
import { EditClientDialog } from "@/components/edit-client-dialog";
import { DeleteButton } from "@/components/delete-button";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientPage({ params }: PageProps) {
  const { id } = await params;

  // 1. Buscamos al cliente y sus casos
  const client = await db.client.findUnique({
    where: { id: id },
    include: { 
      cases: {
        orderBy: { createdAt: 'desc' }
      } 
    }
  });

  if (!client) return notFound();

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-8">
      
      {/* Botón Volver */}
      <Link href="/">
        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-black pl-0">
          ← Volver al Tablero
        </Button>
      </Link>

      {/* SECCIÓN PRINCIPAL */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
                 <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-bold text-gray-900">{client.lastName}, {client.firstName}</h1>
                    <EditClientDialog client={client} />
                 </div>
            </div>
            <CreateCaseDialog clientId={client.id} />
        </div>

        {/* --- FICHA DE DATOS MEJORADA --- */}
        <div className="bg-gray-50 p-5 rounded-xl border mt-4 text-sm shadow-sm">
            
            {/* Fila 1: Identificación Legal */}
            <div className="flex flex-wrap items-center gap-6 mb-4 border-b pb-4 border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl">📇</span>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Documento</p>
                        <p className="font-bold text-gray-900">{client.docType} {client.dni || "---"}</p>
                    </div>
                </div>
                {client.cuit && (
                    <div>
                         <p className="text-xs text-gray-500 uppercase font-bold">CUIT/CUIL</p>
                         <p className="text-gray-900">{client.cuit}</p>
                    </div>
                )}
                <div>
                     <p className="text-xs text-gray-500 uppercase font-bold">Nacimiento</p>
                     <p className="text-gray-900">
                        {client.birthDate ? client.birthDate.toLocaleDateString() : "-"} 
                        {client.birthPlace && <span className="text-gray-500"> ({client.birthPlace})</span>}
                     </p>
                </div>
            </div>

            {/* Fila 2: Columnas */}
            <div className="grid md:grid-cols-2 gap-6 items-start"> 
                {/* items-start es clave para que no se estiren las cajas */}
                
                {/* COLUMNA IZQUIERDA */}
                <div className="space-y-4">
                    <div>
                        <p className="font-bold text-gray-900 mb-1 flex items-center gap-2">📍 Domicilio</p>
                        <p className="text-gray-700 bg-white p-3 rounded border shadow-sm">
                            {client.address || "Calle s/n"}, {client.location || "Santa Fe"}
                        </p>
                    </div>

                    {client.occupation && (
                        <div>
                             <p className="font-bold text-gray-900 mb-1 flex items-center gap-2">👷 Ocupación</p>
                             <p className="text-gray-700 bg-white p-3 rounded border shadow-sm">
                                {client.occupation}
                             </p>
                        </div>
                    )}
                </div>
                
                {/* COLUMNA DERECHA: Contacto Compacto */}
                <div>
                    <p className="font-bold text-gray-900 mb-1 flex items-center gap-2">📞 Contacto</p>
                    <div className="text-gray-700 bg-white p-3 rounded border shadow-sm space-y-3">
                        
                        {/* Bloque Celular con WhatsApp Inteligente */}
                        <div className="flex items-center gap-3">
                             <span className="text-xl">📱</span> 
                             <div className="flex flex-col">
                                <span className="font-medium text-gray-900">
                                    {client.phone || "Sin celular"}
                                </span>
                                
                                {/* Si hay teléfono, mostramos el botón de WhatsApp */}
                                {client.phone && (
                                    <a 
                                        /* Lógica: 
                                           1. "549" es el código de Argentina para celulares.
                                           2. .replace(/\D/g, '') borra todo lo que NO sea número (espacios, guiones).
                                        */
                                        href={`https://wa.me/549${client.phone.replace(/\D/g, '')}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs font-bold text-green-600 hover:text-green-800 hover:underline flex items-center gap-1 mt-0.5"
                                    >
                                        💬 Abrir WhatsApp
                                    </a>
                                )}
                             </div>
                        </div>
                        
                        {client.email && (
                            <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
                                <span className="text-xl">📧</span> 
                                <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                                    {client.email}
                                </a>
                            </div>
                        )}

                        {/* Bloque de Urgencia Destacado */}
                        {client.familyPhone && (
                            <div className="pt-3 border-t border-gray-100">
                                <div className="bg-red-50 border border-red-100 rounded-lg p-2">
                                    <p className="text-xs font-bold text-red-500 uppercase mb-1 flex items-center gap-1">
                                        🚨 En caso de urgencia
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <p className="text-red-700 font-bold text-base">
                                            {client.familyPhone}
                                        </p>
                                        <a 
                                            href={`https://wa.me/549${client.familyPhone.replace(/\D/g, '')}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs bg-white border border-red-200 text-red-600 px-2 py-1 rounded hover:bg-red-100 font-bold"
                                        >
                                            Enviar WhatsApp
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        {/* --- FIN FICHA --- */}

      </div>

      {/* LISTA DE EXPEDIENTES */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          📂 Expedientes
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{client.cases.length}</span>
        </h2>

        {client.cases.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed rounded-xl p-10 text-center text-gray-500">
            <p>Carpeta vacía.</p>
            <p className="text-sm">Usá el botón negro para iniciar un expediente.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {client.cases.map((c) => (
              <Card key={c.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500 h-full relative group">
                  
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DeleteButton id={c.id} type="CASE" clientId={client.id} />
                  </div>

                  <Link href={`/client/${client.id}/case/${c.id}`} className="block h-full">
                    <CardHeader className="pb-2 pt-4 pr-10">
                        <CardTitle className="text-lg font-bold text-blue-900">{c.caratula}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">Exp: {c.code}</p>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-gray-700 mb-2">🏛️ {c.juzgado}</div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase ${
                            c.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200' :
                            c.status === 'MEDIATION' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                            'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                            {c.status === 'ACTIVE' ? 'En Trámite' : c.status === 'MEDIATION' ? 'Mediación' : 'Archivado'}
                        </span>
                    </CardContent>
                  </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}