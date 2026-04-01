"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  LayoutGrid, 
  Gavel, 
  Users, 
  Briefcase, 
  ShieldAlert, 
  HeartHandshake,
  FolderOpen
} from "lucide-react";

const areas = [
  { id: "CIVIL", label: "Civil", icon: Gavel },
  { id: "FAMILIA", label: "Familia", icon: Users },
  { id: "LABORAL", label: "Laboral", icon: Briefcase },
  { id: "PENAL", label: "Penal", icon: ShieldAlert },
  { id: "PREVISIONAL", label: "Previsional", icon: HeartHandshake },
  { id: "EXTRAJUDICIAL", label: "Admin / Extrajud.", icon: FolderOpen },
];

export function AreaFilter() {
  const searchParams = useSearchParams();
  const currentArea = searchParams.get("area");
  const query = searchParams.get("q");

  const createUrl = (areaId?: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (areaId) params.set("area", areaId);
    return `/?${params.toString()}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={createUrl()}>
        <Button 
          variant={!currentArea ? "default" : "outline"} 
          size="sm" 
          className={`rounded-full h-8 px-3 text-xs border ${!currentArea ? 'bg-blue-600 hover:bg-blue-700 text-white border-transparent' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <LayoutGrid className="h-3.5 w-3.5 mr-1.5" /> Todos
        </Button>
      </Link>

      {areas.map((area) => {
        const Icon = area.icon;
        const isActive = currentArea === area.id;
        
        return (
          <Link key={area.id} href={isActive ? createUrl() : createUrl(area.id)}>
            <Button 
              variant={isActive ? "default" : "outline"} 
              size="sm" 
              className={`rounded-full h-8 px-3 text-xs border ${isActive ? 'bg-blue-600 hover:bg-blue-700 text-white border-transparent' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <Icon className="h-3.5 w-3.5 mr-1.5" /> {area.label}
            </Button>
          </Link>
        );
      })}
    </div>
  );
}