"use client";

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <footer className="mt-auto border-t border-slate-200/70 bg-transparent dark:border-slate-800/70">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 py-3 text-[11px] text-slate-400 dark:text-slate-500">
        <span>Estudio Juridico Digital</span>
        <span className="hidden md:inline">Argentina · Paraguay</span>
        <span>© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
