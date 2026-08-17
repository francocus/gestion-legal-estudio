import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, BellRing, ExternalLink } from "lucide-react";

export interface TurnoSena {
  id: string;
  title: string;
  date: Date | string;
  depositAmount: number | null;
  depositPaid: boolean;
  client?: {
    id: string;
    lastName: string;
    firstName: string;
  } | null;
  case?: {
    id: string;
    caratula: string;
  } | null;
}

export function TurnosSenasSection({
  appointments,
  pendingDepositAmount,
  paidDepositAmount,
  todayCount,
}: {
  appointments: TurnoSena[];
  pendingDepositAmount: number;
  paidDepositAmount: number;
  todayCount: number;
}) {
  const pendingCount = appointments.filter((item) => !item.depositPaid).length;
  const paidCount = appointments.filter((item) => item.depositPaid).length;

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Turnos y señas</h3>
        <p className="text-sm text-slate-500">
          Seguimiento operativo de anticipos asociados a turnos del estudio.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Señas pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">$ {pendingDepositAmount.toLocaleString("es-AR")}</div>
            <p className="text-xs text-slate-500 mt-1">{pendingCount} turno(s) con anticipo pendiente</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-emerald-500">
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Señas cobradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">$ {paidDepositAmount.toLocaleString("es-AR")}</div>
            <p className="text-xs text-slate-500 mt-1">{paidCount} turno(s) con anticipo registrado</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-fuchsia-500">
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Turnos con seña</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fuchsia-600 dark:text-fuchsia-400">{appointments.length}</div>
            <p className="text-xs text-slate-500 mt-1">Turnos con reserva o anticipo asociado</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Turnos con seña hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{todayCount}</div>
            <p className="text-xs text-slate-500 mt-1">Control inmediato del día</p>
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-slate-900/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-fuchsia-500" /> Señas por turno
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {appointments.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No hay turnos con señas registradas todavia.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Turno</th>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Cliente</th>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Fecha</th>
                    <th className="px-5 py-3 text-right text-[10px] uppercase tracking-widest text-slate-500">Seña</th>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Estado</th>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {appointments.map((item) => (
                    <tr key={item.id} className="bg-white dark:bg-slate-900">
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{item.title}</p>
                        {item.case && (
                          <p className="mt-1 text-xs text-slate-500">{item.case.caratula}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                        {item.client ? `${item.client.lastName}, ${item.client.firstName}` : "Sin cliente"}
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <BellRing className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(item.date).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                        </div>
                      </td>
                      <td className={`px-5 py-4 text-right font-mono ${item.depositPaid ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                        $ {(item.depositAmount || 0).toLocaleString("es-AR")}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                          item.depositPaid
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        }`}>
                          {item.depositPaid ? "Cobrada" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-2">
                          {item.client && (
                            <Link
                              href={`/client/${item.client.id}`}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/50"
                            >
                              Ver cliente
                            </Link>
                          )}
                          {item.case && item.client && (
                            <Link
                              href={`/client/${item.client.id}/case/${item.case.id}`}
                              className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-950/30"
                            >
                              <ExternalLink className="h-3 w-3" /> Abrir expediente
                            </Link>
                          )}
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
