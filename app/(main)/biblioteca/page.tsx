import { db } from "@/lib/db";
import { BibliotecaPanel } from "@/components/biblioteca-panel";
import { Scale, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function BibliotecaPage() {
  const sources = await db.legalSource.findMany({
    orderBy: [
      { country: "asc" },
      { publicationDate: "desc" },
      { createdAt: "desc" },
    ],
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 dark:text-white">
            <Scale className="h-8 w-8 text-indigo-500" />
            Biblioteca Juridica
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Base juridica de Argentina y Paraguay, organizada por materia, tipo de fuente y vinculacion con expedientes.
          </p>
        </div>

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
