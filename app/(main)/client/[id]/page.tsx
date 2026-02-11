import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CreateCaseDialog } from "@/components/create-case-dialog";
import { EditClientDialog } from "@/components/edit-client-dialog";
import { DeleteButton } from "@/components/delete-button";

// 👇 IMPORTACIÓN DE ICONOS PROFESIONALES (Agregué MessageCircle)
import { 
  ChevronLeft, 
  IdCard, 
  MapPin, 
  Briefcase, 
  Phone, 
  Mail, 
  AlertCircle, 
  Folder,
  Gavel,
  Users,
  ShieldAlert,
  HeartHandshake,
  LayoutGrid,
  FileText,
  MessageCircle 
} from "lucide-react";

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
    <div className="w-full p-6 space-y-6">
      
      {/* Botón Volver */}
      <Link href="/">
        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white pl-0 flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> Volver al Tablero
        </Button>
      </Link>

      {/* SECCIÓN PRINCIPAL */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
                 <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{client.lastName}, {client.firstName}</h1>
                    <EditClientDialog client={client} />
                 </div>
            </div>
            <CreateCaseDialog clientId={client.id} />
        </div>

        {/* --- FICHA DE DATOS MEJORADA CON ICONOS --- */}
        <div className="bg-gray-50 dark:bg-slate-900/50 p-5 rounded-xl border border-gray-200 dark:border-slate-800 mt-4 text-sm shadow-sm">
            
            {/* Fila 1: Identificación Legal */}
            <div className="flex flex-wrap items-center gap-6 mb-4 border-b pb-4 border-gray-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <IdCard className="h-5 w-5 text-blue-500" />
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Documento</p>
                        <p className="font-bold text-gray-900 dark:text-gray-100">{client.docType} {client.dni || "---"}</p>
                    </div>
                </div>
                {client.cuit && (
                    <div className="flex items-center gap-2 border-l pl-6 border-gray-200 dark:border-slate-800">
                         <div>
                             <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">CUIT/CUIL</p>
                             <p className="text-gray-900 dark:text-gray-100 font-mono font-bold">{client.cuit}</p>
                         </div>
                    </div>
                )}
                <div className="flex items-center gap-2 border-l pl-6 border-gray-200 dark:border-slate-800">
                     <div>
                         <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Nacimiento</p>
                         <p className="text-gray-900 dark:text-gray-100">
                            <span className="font-bold">{client.birthDate ? client.birthDate.toLocaleDateString() : "-"}</span>
                            {client.birthPlace && <span className="text-gray-500 dark:text-gray-400 italic"> ({client.birthPlace})</span>}
                         </p>
                     </div>
                </div>
            </div>

            {/* Fila 2: Columnas */}
            <div className="grid md:grid-cols-2 gap-6 items-start"> 
                
                {/* COLUMNA IZQUIERDA: Domicilio y Ocupación */}
                <div className="space-y-4">
                    <div>
                        <p className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-red-500" /> Domicilio
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-950 p-3 rounded border border-gray-200 dark:border-slate-800 shadow-sm font-medium">
                            {client.address || "Calle s/n"}, {client.location || "Santa Fe"}
                        </p>
                    </div>

                    {client.occupation && (
                        <div>
                             <p className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-amber-500" /> Ocupación
                             </p>
                             <p className="text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-950 p-3 rounded border border-gray-200 dark:border-slate-800 shadow-sm font-medium">
                                {client.occupation}
                             </p>
                        </div>
                    )}
                </div>
                
                {/* COLUMNA DERECHA: Contacto */}
                <div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-emerald-500" /> Contacto
                    </p>
                    <div className="text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-950 p-3 rounded border border-gray-200 dark:border-slate-800 shadow-sm space-y-3">
                        
                        {/* Bloque Celular */}
                        <div className="flex items-center gap-3">
                             <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                                 <Phone className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                             </div>
                             <div className="flex flex-col">
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {client.phone || "Sin celular"}
                                </span>
                                
                                {client.phone && (
                                    <a 
                                        href={`https://wa.me/549${client.phone.replace(/\D/g, '')}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs font-bold text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:underline flex items-center gap-1 mt-0.5"
                                    >
                                        <MessageCircle className="h-3 w-3" /> Abrir WhatsApp
                                    </a>
                                )}
                             </div>
                        </div>
                        
                        {/* Email */}
                        {client.email && (
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                                    <Mail className="h-4 w-4 text-blue-500" />
                                </div>
                                <a href={`mailto:${client.email}`} className="text-blue-600 dark:text-blue-400 hover:underline overflow-hidden text-ellipsis font-medium">
                                    {client.email}
                                </a>
                            </div>
                        )}

                        {/* Bloque de Urgencia Destacado */}
                        {client.familyPhone && (
                            <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
                                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-3">
                                    <p className="text-xs font-bold text-red-500 dark:text-red-400 uppercase mb-2 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" /> EN CASO DE URGENCIA
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <p className="text-red-700 dark:text-red-300 font-bold text-base">
                                            {client.familyPhone}
                                        </p>
                                        <a 
                                            href={`https://wa.me/549${client.familyPhone.replace(/\D/g, '')}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-[10px] bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 font-bold transition-colors"
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
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 dark:text-white">
          <Folder className="h-6 w-6 text-blue-500" /> Expedientes
          <span className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">{client.cases.length}</span>
        </h2>

        {client.cases.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl p-10 text-center text-gray-500 dark:text-gray-400">
            <LayoutGrid className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Carpeta vacía.</p>
            <p className="text-sm">Usá el botón azul para iniciar un expediente.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {client.cases.map((c) => {
               // Mapeo de iconos por fuero
               const iconMap = {
                   FAMILIA: { icon: Users, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-900/20", border: "border-pink-100 dark:border-pink-900" },
                   PENAL: { icon: ShieldAlert, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-100 dark:border-red-900" },
                   LABORAL: { icon: Briefcase, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-100 dark:border-emerald-900" },
                   PREVISIONAL: { icon: HeartHandshake, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-100 dark:border-amber-900" },
                   CIVIL: { icon: Gavel, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-100 dark:border-blue-900" },
                   ADMINISTRATIVO: { icon: FileText, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/20", border: "border-slate-100 dark:border-slate-800" },
               };
               const areaInfo = iconMap[c.area as keyof typeof iconMap] || iconMap.CIVIL;
               const AreaIcon = areaInfo.icon;

               return (
                  <Card key={c.id} className="hover:shadow-lg transition-all border-l-4 border-l-blue-600 h-full relative group dark:bg-slate-900 dark:border-y-slate-800 dark:border-r-slate-800 dark:border-l-blue-500">
                    
                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DeleteButton id={c.id} type="CASE" clientId={client.id} />
                    </div>

                    <Link href={`/client/${client.id}/case/${c.id}`} className="block h-full">
                      <CardHeader className="pb-2 pt-4 pr-10">
                          <CardTitle className="text-lg font-bold text-blue-900 dark:text-blue-300 leading-tight">{c.caratula}</CardTitle>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-tighter">Exp: {c.code}</p>
                      </CardHeader>
                      <CardContent>
                          <div className="text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2 font-medium italic">
                               <Gavel className="h-4 w-4 text-slate-400" /> {c.juzgado}
                          </div>

                          <div className="flex flex-wrap gap-2">
                              {/* STATUS BADGE */}
                              <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-widest ${
                                  c.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900' :
                                  c.status === 'MEDIATION' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900' :
                                  'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700'
                              }`}>
                                  {c.status === 'ACTIVE' ? 'En Trámite' : c.status === 'MEDIATION' ? 'Mediación' : 'Archivado'}
                              </span>

                              {/* AREA TAG */}
                              {c.area && (
                                  <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase flex items-center gap-1 ${areaInfo.bg} ${areaInfo.color} ${areaInfo.border} tracking-widest`}>
                                      <AreaIcon className="h-3 w-3" />
                                      {c.area}
                                  </span>
                              )}
                          </div>
                      </CardContent>
                    </Link>
                  </Card>
               );
            })}
          </div>
        )}
      </div>
    </div>
  );
}