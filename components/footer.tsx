"use client";

import { usePathname } from "next/navigation";
// 👇 IMPORTACIÓN DE ICONOS
import { ExternalLink } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  // 🚫 En el login mantenemos la pantalla limpia, sin footer.
  if (pathname === "/login") return null;

  const links = [
    { name: "SISFE (Poder Judicial)", url: "https://sisfe.justiciasantafe.gov.ar/login" },
    { name: "COLABRO (Colegio de Abogados de Rosario)", url: "https://www.colabro.org.ar" },
    { name: "Caja Forense", url: "https://www.cajaforense.com" },
    { name: "C.A.P. Santa Fe", url: "https://www.capsantafe.org.ar" },
  ];

  return (
    <footer className="border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50 py-8 mt-auto">
      <div className="w-full px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm">
        
        {/* Copyright / Marca */}
        <div className="text-gray-400 dark:text-gray-500 font-medium">
            © {new Date().getFullYear()} Estudio Jurídico Digital
        </div>

        {/* Links Externos */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {links.map((link) => (
                <a 
                    key={link.name} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors font-medium flex items-center gap-1.5 hover:underline"
                >
                    <ExternalLink className="h-3.5 w-3.5" /> {link.name}
                </a>
            ))}
        </div>

      </div>
    </footer>
  );
}