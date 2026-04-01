import { db } from "@/lib/db";
import { BibliotecaPanel } from "@/components/biblioteca-panel";
import { Scale, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function BibliotecaPage() {
  // Traemos todas las leyes/fallos ordenados de más nuevos a más viejos
  const sources = await db.legalSource.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* CABECERA CON EL NUEVO BOTÓN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 dark:text-white">
            <Scale className="h-8 w-8 text-indigo-500" />
            Biblioteca Jurídica
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Repositorio central de leyes, códigos y jurisprudencia del estudio.
          </p>
        </div>
        
        {/* BOTÓN AL COMPARADOR MANUAL DE IA */}
        <Link href="/biblioteca/ia-demo">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-sm">
            <Sparkles className="h-4 w-4" />
            Comparador IA Manual
          </Button>
        </Link>
      </div>

      <BibliotecaPanel initialSources={sources} />
    </div>
  );
}