import { db } from "@/lib/db";
import { CreateClientDialog } from "@/components/client-form";
import { SearchInput } from "@/components/search-input"; // 👈 Importamos el buscador
import { DeleteButton } from "@/components/delete-button"; // 👈 Mantenemos el botón de borrar
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string; // "q" es lo que escribimos en el buscador
  }>;
}

export default async function Home({ searchParams }: PageProps) {
  
  // 1. Leemos la búsqueda de la URL
  const params = await searchParams;
  const query = params.q || ""; // Si no hay nada, es texto vacío

  // 2. Buscamos clientes FILTRADOS
  const clients = await db.client.findMany({
    where: {
        OR: [
            // Busca si el apellido CONTIENE lo escrito (sin importar mayúsculas)
            { lastName: { contains: query, mode: 'insensitive' } },
            // O si el nombre CONTIENE lo escrito
            { firstName: { contains: query, mode: 'insensitive' } },
        ]
    },
    orderBy: { createdAt: "desc" },
    include: { cases: true }
  });

  // 3. Buscamos EVENTOS URGENTES (Esto sigue igual)
  const urgentEvents = await db.event.findMany({
    where: { isDone: false },
    orderBy: { date: "asc" },
    take: 5,
    include: {
        case: { include: { client: true } }
    }
  });

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-10">
      
      {/* SECCIÓN 1: CABECERA */}
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-4xl font-bold text-gray-900">Estudio Jurídico</h1>
            <p className="text-gray-500 mt-2">Panel de Control General</p>
        </div>
        <div className="text-right hidden sm:block">
            <p className="text-sm text-gray-400">Hoy es</p>
            <p className="text-xl font-medium">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* SECCIÓN 2: ALERTA DE VENCIMIENTOS */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
            <h2 className="text-red-800 font-bold flex items-center gap-2">
                🔥 Agenda Urgente (Próximos eventos)
            </h2>
        </div>
        
        <div className="divide-y">
            {urgentEvents.length === 0 ? (
                <div className="p-8 text-center text-gray-400 italic">
                    🎉 ¡Todo tranquilo! No hay vencimientos pendientes.
                </div>
            ) : (
                urgentEvents.map((evt) => (
                    <Link 
                        key={evt.id} 
                        href={`/client/${evt.case.clientId}/case/${evt.caseId}`}
                        className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="text-center bg-gray-100 rounded px-3 py-2 min-w-[60px] border">
                                <span className="block text-xs uppercase text-gray-500">
                                    {evt.date.toLocaleDateString('es-ES', { month: 'short' })}
                                </span>
                                <span className="block text-xl font-bold text-gray-900">
                                    {evt.date.getDate()}
                                </span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                        evt.type === 'DEADLINE' ? 'bg-red-100 text-red-700 border-red-200' : 
                                        evt.type === 'HEARING' ? 'bg-orange-100 text-orange-700 border-orange-200' : 
                                        'bg-blue-100 text-blue-700 border-blue-200'
                                    }`}>
                                        {evt.type === 'DEADLINE' ? 'Vencimiento' : evt.type === 'HEARING' ? 'Audiencia' : 'Reunión'}
                                    </span>
                                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {evt.title}
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Expte Nº: {evt.case.caratula} • Cliente: {evt.case.client.lastName}
                                </p>
                            </div>
                        </div>
                        <div className="text-gray-400 group-hover:translate-x-1 transition-transform">→</div>
                    </Link>
                ))
            )}
        </div>
      </div>

      {/* SECCIÓN 3: TUS CLIENTES + BUSCADOR */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">📇 Mis Clientes</h2>
            
            {/* 🔎 AQUÍ ESTÁ EL BUSCADOR Y EL BOTÓN DE CREAR */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <SearchInput />
                <CreateClientDialog />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-shadow h-full border-t-4 border-t-gray-800 relative group">
                
                {/* Botón de Borrar (Mantenemos tu funcionalidad) */}
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DeleteButton id={client.id} type="CLIENT" />
                </div>

                <Link href={`/client/${client.id}`} className="block h-full">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-start pr-8">
                            <span className="text-xl">{client.lastName}, {client.firstName}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p>📧 {client.email || "Sin email"}</p>
                            <p>📞 {client.phone || "Sin teléfono"}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                            <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded">
                                {client.cases.length} {client.cases.length === 1 ? 'Expediente' : 'Expedientes'}
                            </span>
                            <span className="text-blue-600 text-sm font-bold hover:underline">Ver carpeta →</span>
                        </div>
                    </CardContent>
                </Link>
            </Card>
          ))}
          
          {clients.length === 0 && (
             <div className="col-span-full text-center py-10 bg-slate-50 border-2 border-dashed rounded-xl">
                <p className="text-gray-500 font-medium">
                    {query ? `No encontramos a nadie llamado "${query}" 🕵️‍♂️` : "Todavía no tenés clientes."}
                </p>
                {!query && <p className="text-sm text-gray-400 mt-1">Usá el botón negro para crear el primero.</p>}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}