"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
// Importamos los iconos profesionales
import { 
  Gavel, 
  Users, 
  Briefcase, 
  ShieldAlert, 
  HeartHandshake, 
  FileText,
  LayoutGrid
} from "lucide-react";

export function AreaFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentArea = searchParams.get("area");
  const currentQuery = searchParams.get("q") || "";

  const filters = [
    { label: "Todos", value: null, icon: LayoutGrid, color: "text-gray-500" },
    { label: "Civil", value: "CIVIL", icon: Gavel, color: "text-blue-500" },
    { label: "Familia", value: "FAMILIA", icon: Users, color: "text-pink-500" },
    { label: "Laboral", value: "LABORAL", icon: Briefcase, color: "text-emerald-500" },
    { label: "Penal", value: "PENAL", icon: ShieldAlert, color: "text-red-500" },
    { label: "Previsional", value: "PREVISIONAL", icon: HeartHandshake, color: "text-amber-500" },
  ];

  const handleFilter = (area: string | null) => {
    const params = new URLSearchParams();
    if (currentQuery) params.set("q", currentQuery);
    if (area) params.set("area", area);
    
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {filters.map((f) => {
        const isActive = currentArea === f.value;
        const Icon = f.icon;
        
        return (
          <button
            key={f.label}
            onClick={() => handleFilter(f.value)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border",
              isActive 
                ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 dark:bg-slate-900 dark:text-gray-400 dark:border-slate-800 dark:hover:border-slate-700"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", isActive ? "text-white" : f.color)} />
            {f.label}
          </button>
        );
      })}
    </div>
  );
}