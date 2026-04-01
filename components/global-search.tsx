"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search, Calculator, Users, Loader2, Building2, Gavel } from "lucide-react";
import { searchGlobal } from "@/lib/actions/search";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface SearchClientResult {
  id: string;
  firstName: string;
  lastName: string;
  dni: string | null;
  phone: string | null;
}

interface SearchCaseResult {
  id: string;
  caratula: string;
  code: string | null;
  clientId: string;
  isExtrajudicial: boolean;
  area: string;
}

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [data, setData] = React.useState<{ clients: SearchClientResult[]; cases: SearchCaseResult[] }>({ clients: [], cases: [] });
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (query.length < 2) {
      setData({ clients: [], cases: [] });
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      const results = await searchGlobal(query);
      setData(results);
      setLoading(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="relative h-9 w-full justify-start rounded-[0.5rem] bg-slate-100 dark:bg-slate-800/50 text-sm text-slate-500 sm:pr-12 md:w-40 lg:w-64 border-slate-200 dark:border-slate-700 shadow-inner hover:bg-slate-200 dark:hover:bg-slate-800"
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Buscar clientes, carpetas...</span>
        <span className="inline-flex lg:hidden">Buscar...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-white dark:bg-slate-900 px-1.5 font-mono text-[10px] font-medium text-slate-500 opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 overflow-hidden shadow-2xl sm:max-w-[600px] dark:bg-slate-950 dark:border-slate-800 rounded-xl">
            <VisuallyHidden>
                <DialogTitle>Buscador Global</DialogTitle>
            </VisuallyHidden>

            <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-slate-500 [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-14 [&_[cmdk-input]]:text-base [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5 dark:bg-slate-950">
            
            <CommandInput 
                placeholder="Escribí un apellido, DNI, carátula, teléfono..." 
                value={query}
                onValueChange={setQuery}
                className="dark:border-slate-800 border-b-0"
            />
            
            <CommandList className="max-h-[400px]">
                <CommandEmpty>
                    {loading ? (
                        <div className="flex items-center justify-center py-10 text-sm text-slate-500 gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" /> Buscando en la base de datos...
                        </div>
                    ) : (
                        query.length > 0 && <div className="py-10 text-center text-slate-500">No se encontraron resultados para &quot;{query}&quot;.</div>
                    )}
                </CommandEmpty>

                {/* RESULTADOS DE CLIENTES */}
                {data.clients.length > 0 && (
                <CommandGroup heading="Directorio de Clientes">
                    {data.clients.map((client) => (
                    <CommandItem
                        key={client.id}
                        value={`client-${client.id}`} 
                        onSelect={() => runCommand(() => router.push(`/client/${client.id}`))}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg mb-1"
                    >
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md mr-3">
                            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{client.lastName}, {client.firstName}</span>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                {client.dni && <span>DNI: {client.dni}</span>}
                                {client.dni && client.phone && <span>•</span>}
                                {client.phone && <span>Tel: {client.phone}</span>}
                            </div>
                        </div>
                    </CommandItem>
                    ))}
                </CommandGroup>
                )}
                
                {data.clients.length > 0 && data.cases.length > 0 && <CommandSeparator className="my-2" />}

                {/* RESULTADOS DE EXPEDIENTES / CARPETAS */}
                {data.cases.length > 0 && (
                <CommandGroup heading="Expedientes y Carpetas">
                    {data.cases.map((c) => (
                    <CommandItem
                        key={c.id}
                        value={`case-${c.id}`}
                        onSelect={() => runCommand(() => router.push(`/client/${c.clientId}/case/${c.id}`))}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg mb-1"
                    >
                        <div className={`p-2 rounded-md mr-3 ${c.isExtrajudicial ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                            {c.isExtrajudicial 
                                ? <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> 
                                : <Gavel className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            }
                        </div>
                        <div className="flex flex-col flex-1 overflow-hidden">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">{c.caratula}</span>
                            
                            {c.isExtrajudicial ? (
                                <span className="text-[10px] uppercase font-bold text-indigo-500 mt-0.5 tracking-wider">
                                    Carpeta {c.area || 'Admin'}
                                </span>
                            ) : (
                                <span className="text-xs text-slate-500 font-mono mt-0.5">
                                    Expte: {c.code || "Sin número"}
                                </span>
                            )}
                        </div>
                    </CommandItem>
                    ))}
                </CommandGroup>
                )}

                {/* ACCIONES RÁPIDAS (Solo si no hay búsqueda) */}
                {query.length === 0 && (
                    <>
                    <CommandGroup heading="Accesos Rápidos">
                        <CommandItem value="home" onSelect={() => runCommand(() => router.push("/"))} className="cursor-pointer py-3">
                            <Search className="mr-3 h-4 w-4 text-slate-400" /> Ir al Tablero Principal
                        </CommandItem>
                        <CommandItem value="contabilidad" onSelect={() => runCommand(() => router.push("/contabilidad"))} className="cursor-pointer py-3">
                            <Calculator className="mr-3 h-4 w-4 text-slate-400" /> Ver Reportes Financieros
                        </CommandItem>
                    </CommandGroup>
                    </>
                )}

            </CommandList>
            </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
