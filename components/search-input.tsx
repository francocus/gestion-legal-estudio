"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

export function SearchInput() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  function handleSearch(term: string) {
    const params = new URLSearchParams(searchParams);
    
    if (term) {
      params.set("q", term); // Agrega ?q=loqueescribas a la URL
    } else {
      params.delete("q");    // Si borrás todo, limpia la URL
    }
    
    // Actualiza la URL sin recargar la página
    replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="relative w-full max-w-sm">
        {/* Ícono de lupa */}
        <svg
            className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500"
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        
        <Input
            className="pl-9 bg-white" // Espacio para la lupa
            placeholder="Buscar por apellido o nombre..."
            onChange={(e) => handleSearch(e.target.value)}
            defaultValue={searchParams.get("q")?.toString()}
        />
    </div>
  );
}