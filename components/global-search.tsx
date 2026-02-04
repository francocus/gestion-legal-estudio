"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
// 👇 Importamos Dialog y Command por separado para tener control total
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
import { Search, Calculator, Users, FolderOpen, Loader2 } from "lucide-react";
import { searchGlobal } from "@/app/actions";
// 👇 Componente para ocultar el título visualmente (accesibilidad)
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [data, setData] = React.useState<{ clients: any[]; cases: any[] }>({ clients: [], cases: [] });
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  // 1. Escuchar atajo de teclado (Ctrl + K)
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

  // 2. Ejecutar búsqueda en servidor
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
        className="relative h-9 w-full justify-start rounded-[0.5rem] bg-slate-100 dark:bg-slate-800 text-sm text-slate-500 sm:pr-12 md:w-40 lg:w-64 border-slate-200 dark:border-slate-700 shadow-none hover:bg-slate-200 dark:hover:bg-slate-700"
      >
        <span className="hidden lg:inline-flex">Buscar...</span>
        <span className="inline-flex lg:hidden">Buscar...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-white dark:bg-slate-900 px-1.5 font-mono text-[10px] font-medium text-slate-500 opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* 👇 SOLUCIÓN: Usamos Dialog + Command por separado */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 overflow-hidden shadow-2xl sm:max-w-[550px] dark:bg-slate-950 dark:border-slate-800">
            {/* Título oculto para accesibilidad (evita warnings en consola) */}
            <VisuallyHidden>
                <DialogTitle>Buscador Global</DialogTitle>
            </VisuallyHidden>

            {/* 👇 shouldFilter={false} EVITA que el navegador oculte los resultados del servidor */}
            <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5 dark:bg-slate-950">
            
            <CommandInput 
                placeholder="Escribí nombre, expediente o DNI..." 
                value={query}
                onValueChange={setQuery}
                className="dark:border-slate-800"
            />
            
            <CommandList>
                <CommandEmpty>
                    {loading ? (
                        <div className="flex items-center justify-center py-6 text-sm text-slate-500 gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
                        </div>
                    ) : (
                        query.length > 0 && "No se encontraron resultados."
                    )}
                </CommandEmpty>

                {/* RESULTADOS DE CLIENTES */}
                {data.clients.length > 0 && (
                <CommandGroup heading="Clientes">
                    {data.clients.map((client) => (
                    <CommandItem
                        key={client.id}
                        value={`client-${client.id}`} 
                        onSelect={() => runCommand(() => router.push(`/client/${client.id}`))}
                        className="cursor-pointer"
                    >
                        <Users className="mr-2 h-4 w-4 text-blue-500" />
                        <span>{client.lastName}, {client.firstName}</span>
                        {client.dni && <span className="ml-2 text-xs text-slate-400">({client.dni})</span>}
                    </CommandItem>
                    ))}
                </CommandGroup>
                )}
                
                {data.clients.length > 0 && data.cases.length > 0 && <CommandSeparator />}

                {/* RESULTADOS DE EXPEDIENTES */}
                {data.cases.length > 0 && (
                <CommandGroup heading="Expedientes">
                    {data.cases.map((c) => (
                    <CommandItem
                        key={c.id}
                        value={`case-${c.id}`}
                        onSelect={() => runCommand(() => router.push(`/client/${c.clientId}/case/${c.id}`))}
                        className="cursor-pointer"
                    >
                        <FolderOpen className="mr-2 h-4 w-4 text-amber-500" />
                        <span>{c.caratula}</span>
                        <span className="ml-auto text-xs font-mono text-slate-400">{c.code}</span>
                    </CommandItem>
                    ))}
                </CommandGroup>
                )}

                {/* ACCIONES RÁPIDAS (Solo si no hay búsqueda) */}
                {query.length === 0 && (
                    <>
                    <CommandSeparator />
                    <CommandGroup heading="Accesos Rápidos">
                        <CommandItem value="home" onSelect={() => runCommand(() => router.push("/"))} className="cursor-pointer">
                            <Search className="mr-2 h-4 w-4" /> Ir al Tablero Principal
                        </CommandItem>
                        <CommandItem value="reports" onSelect={() => runCommand(() => router.push("/reports"))} className="cursor-pointer">
                            <Calculator className="mr-2 h-4 w-4" /> Ver Reportes Financieros
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