import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleDollarSign, ExternalLink } from "lucide-react";
import { PrestamosActions } from "@/components/prestamos-actions";

export interface CreditoPorCaso {
  id: string;
  clientId: string;
  caratula: string;
  clientName: string;
  area: string;
  entregado: number;
  recuperado: number;
  saldo: number;
  movimientos: number;
}

export function CreditosSection({
  items,
  entregados,
  recuperados,
  pendientes,
  activos,
}: {
  items: CreditoPorCaso[];
  entregados: number;
  recuperados: number;
  pendientes: number;
  activos: number;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Creditos / Cobranzas</h3>
        <p className="text-sm text-slate-500">
          Seguimiento de entregas de fondos, recuperos y saldos por expediente.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Capital entregado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">$ {entregados.toLocaleString("es-AR")}</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-emerald-500">
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Capital recuperado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">$ {recuperados.toLocaleString("es-AR")}</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-red-500">
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Saldo pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">$ {pendientes.toLocaleString("es-AR")}</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Casos activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activos}</div>
            <p className="text-xs text-slate-500 mt-1">Con saldo pendiente de recuperacion</p>
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-slate-900/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-blue-500" /> Estado de creditos por expediente
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No hay creditos o cobranzas registrados todavia.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Expediente</th>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Cliente</th>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Area</th>
                    <th className="px-5 py-3 text-right text-[10px] uppercase tracking-widest text-slate-500">Entregado</th>
                    <th className="px-5 py-3 text-right text-[10px] uppercase tracking-widest text-slate-500">Recuperado</th>
                    <th className="px-5 py-3 text-right text-[10px] uppercase tracking-widest text-slate-500">Saldo</th>
                    <th className="px-5 py-3 text-right text-[10px] uppercase tracking-widest text-slate-500">Movimientos</th>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item) => (
                    <tr key={item.id} className="bg-white dark:bg-slate-900">
                      <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-200">{item.caratula}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{item.clientName}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {item.area}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-amber-600 dark:text-amber-400">$ {item.entregado.toLocaleString("es-AR")}</td>
                      <td className="px-5 py-4 text-right font-mono text-emerald-600 dark:text-emerald-400">$ {item.recuperado.toLocaleString("es-AR")}</td>
                      <td className="px-5 py-4 text-right font-mono text-red-600 dark:text-red-400">$ {item.saldo.toLocaleString("es-AR")}</td>
                      <td className="px-5 py-4 text-right text-slate-600 dark:text-slate-300">{item.movimientos}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/client/${item.clientId}/case/${item.id}`}
                            className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-950/30"
                          >
                            <ExternalLink className="h-3 w-3" /> Abrir expediente
                          </Link>
                          <Link
                            href={`/client/${item.clientId}`}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/50"
                          >
                            Ver cliente
                          </Link>
                          <PrestamosActions
                            caseId={item.id}
                            clientId={item.clientId}
                            caratula={item.caratula}
                            clientName={item.clientName}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
