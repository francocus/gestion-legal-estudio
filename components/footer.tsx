"use client";

import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  const grupos = [
    {
      titulo: "Poder Judicial 🇦🇷",
      links: [
        { name: "CSJN — Fallos", url: "https://sj.csjn.gov.ar/sj/" },
        { name: "CIAJ", url: "https://www.cij.gov.ar" },
        { name: "SAIJ", url: "https://www.saij.gob.ar" },
        { name: "PJN — Consulta de causas", url: "https://www.pjn.gov.ar" },
      ],
    },
    {
      titulo: "Legislación 🇦🇷",
      links: [
        { name: "Infoleg", url: "https://www.infoleg.gob.ar" },
        { name: "Cód. Civil y Comercial", url: "https://www.saij.gob.ar/26994-nacional-codigo-civil-comercial-nacion-lns0006370-2014-10-01/123456789-0abc-defg-073-6000scanyel" },
        { name: "Cód. Penal", url: "https://www.infoleg.gob.ar/infolegInternet/anexos/15000-19999/16546/texact.htm" },
        { name: "Cód. Procesal Civil", url: "https://www.infoleg.gob.ar/infolegInternet/anexos/15000-19999/16547/texact.htm" },
      ],
    },
    {
      titulo: "Organismos 🇦🇷",
      links: [
        { name: "AFIP", url: "https://www.afip.gob.ar" },
        { name: "Ministerio de Justicia", url: "https://www.argentina.gob.ar/justicia" },
        { name: "Defensoría del Pueblo", url: "https://www.dpn.gob.ar" },
        { name: "RENAPER", url: "https://www.argentina.gob.ar/interior/renaper" },
      ],
    },
    {
      titulo: "Poder Judicial 🇵🇾",
      links: [
        { name: "CSJ Paraguay", url: "https://www.pj.gov.py" },
        { name: "Consulta de Expedientes", url: "https://expedientes.pj.gov.py" },
        { name: "Ministerio Público PY", url: "https://www.ministeriopublico.gov.py" },
        { name: "Defensoría del Pueblo PY", url: "https://www.defensoriadelpueblo.gov.py" },
      ],
    },
    {
      titulo: "Legislación 🇵🇾",
      links: [
        { name: "DIGEJUS", url: "https://www.digejus.gov.py" },
        { name: "Cód. Civil PY", url: "https://www.pj.gov.py/ebook/monografias/nacional/civil/Cod-Civil-comentado.pdf" },
        { name: "SET (Impuestos)", url: "https://www.set.gov.py" },
        { name: "Jurisprudencia PY", url: "https://jurisprudencia.pj.gov.py" },
      ],
    },
  ];

  return (
    <footer className="border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-auto">

      {/* BARRA PRINCIPAL — 5 columnas */}
      <div className="w-full px-6 py-5 grid grid-cols-2 md:grid-cols-5 gap-6">
        {grupos.map((grupo) => (
          <div key={grupo.titulo}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-3">
              {grupo.titulo}
            </p>
            <ul className="space-y-1.5">
              {grupo.links.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 group"
                  >
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* SEPARADOR */}
      <div className="px-6 pb-1 hidden md:flex items-center gap-3 text-[10px] text-slate-300 dark:text-slate-700">
        <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
        <span>🇦🇷 Argentina · 🇵🇾 Paraguay</span>
        <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
      </div>

      {/* BARRA INFERIOR */}
      <div className="border-t border-gray-100 dark:border-slate-800 px-6 py-3 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-600">
        <span>© {new Date().getFullYear()} Estudio Jurídico Digital</span>
        <span className="hidden md:block">Recursos jurídicos — Argentina · Paraguay</span>
      </div>

    </footer>
  );
}