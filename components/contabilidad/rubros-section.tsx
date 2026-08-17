import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface RubroResumen {
  key: string;
  title: string;
  icon: LucideIcon;
  description: string;
  count: number;
  ingresos: number;
  egresos: number;
  saldo: number;
}

export function RubrosSection({ items }: { items: RubroResumen[] }) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Rubros contables</h3>
        <p className="text-sm text-slate-500">
          Resumen por rubro.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.key} className="dark:bg-slate-900/50 shadow-sm border border-slate-200 dark:border-slate-800">
              <CardHeader className="space-y-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="h-4 w-4 text-blue-500" /> {item.title}
                </CardTitle>
                <p className="text-sm text-slate-500">{item.description}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                    <p className="text-[10px] uppercase text-slate-500 font-bold">Ingresos</p>
                    <p className="font-bold text-emerald-600">$ {item.ingresos.toLocaleString("es-AR")}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                    <p className="text-[10px] uppercase text-slate-500 font-bold">Egresos</p>
                    <p className="font-bold text-red-600">$ {item.egresos.toLocaleString("es-AR")}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                    <p className="text-[10px] uppercase text-slate-500 font-bold">Saldo</p>
                    <p className={`font-bold ${item.saldo >= 0 ? "text-blue-600" : "text-red-600"}`}>
                      $ {item.saldo.toLocaleString("es-AR")}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  {item.count} movimientos cargados en este rubro.
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
