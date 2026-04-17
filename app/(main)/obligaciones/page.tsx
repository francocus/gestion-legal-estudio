import Link from "next/link";
import { db } from "@/lib/db";
import { ObligationStatus } from "@prisma/client";
import { AlertTriangle, CalendarClock, CheckCircle2, Landmark, ReceiptText, ShieldCheck, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateObligationDialog } from "@/components/create-obligation-dialog";
import { deleteObligation, updateObligationStatus } from "@/lib/actions/obligations";

export const dynamic = "force-dynamic";

function getTodayStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

function getWeekEnd() {
  const today = getTodayStart();
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  return weekEnd;
}

function getMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

function getEffectiveStatus(status: ObligationStatus, dueDate: Date) {
  if (status === "PENDING" && dueDate < getTodayStart()) {
    return "OVERDUE" as const;
  }
  return status;
}

function getStatusLabel(status: ReturnType<typeof getEffectiveStatus>) {
  switch (status) {
    case "OVERDUE":
      return "Vencida";
    case "FILED":
      return "Presentada";
    case "PAID":
      return "Pagada";
    case "CANCELLED":
      return "Anulada";
    default:
      return "Pendiente";
  }
}

function getStatusClass(status: ReturnType<typeof getEffectiveStatus>) {
  switch (status) {
    case "OVERDUE":
      return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300";
    case "FILED":
      return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
    case "PAID":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "CANCELLED":
      return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    default:
      return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }
}

export default async function ObligacionesPage() {
  async function submitStatusChange(formData: FormData) {
    "use server";
    await updateObligationStatus(formData);
  }

  async function submitDelete(formData: FormData) {
    "use server";
    await deleteObligation(formData);
  }

  const obligations = await db.obligation.findMany({
    orderBy: { dueDate: "asc" },
    include: {
      client: true,
      case: true,
      paymentEntry: true,
    },
  });

  const clients = await db.client.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });

  const cases = await db.case.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      clientId: true,
      caratula: true,
      code: true,
    },
  });

  const today = getTodayStart();
  const weekEnd = getWeekEnd();
  const monthStart = getMonthStart();

  const pending = obligations.filter((item) => item.status === "PENDING");
  const overdue = obligations.filter((item) => item.status === "PENDING" && item.dueDate < today);
  const dueThisWeek = obligations.filter(
    (item) => item.status === "PENDING" && item.dueDate >= today && item.dueDate < weekEnd
  );
  const paidThisMonth = obligations.filter(
    (item) => item.status === "PAID" && !!item.paymentEntry && item.paymentEntry.date >= monthStart
  );
  const pendingAmount = pending.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="flex-1 w-full p-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Obligaciones</h2>
          <p className="text-sm text-slate-500">
            Seguimiento impositivo y administrativo del estudio, con vencimientos, pagos y presentaciones.
          </p>
        </div>

        <CreateObligationDialog
          clients={clients.map((client) => ({
            id: client.id,
            name: `${client.lastName}, ${client.firstName}`,
          }))}
          cases={cases.map((legalCase) => ({
            id: legalCase.id,
            clientId: legalCase.clientId,
            label: legalCase.code ? `${legalCase.code} - ${legalCase.caratula}` : legalCase.caratula,
          }))}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pending.length}</div>
            <p className="text-xs text-slate-500 mt-1">$ {pendingAmount.toLocaleString("es-AR")} en obligaciones abiertas</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-red-500">
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{overdue.length}</div>
            <p className="text-xs text-slate-500 mt-1">Requieren accion inmediata</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Vence esta semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{dueThisWeek.length}</div>
            <p className="text-xs text-slate-500 mt-1">Control cercano de calendario</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-emerald-500">
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pagadas este mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{paidThisMonth.length}</div>
            <p className="text-xs text-slate-500 mt-1">Con impacto contable registrado</p>
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-slate-900/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-blue-500" /> Listado operativo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {obligations.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No hay obligaciones cargadas todavia.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Concepto</th>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Cliente</th>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Organismo</th>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Periodo</th>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Vencimiento</th>
                    <th className="px-5 py-3 text-right text-[10px] uppercase tracking-widest text-slate-500">Monto</th>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Estado</th>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {obligations.map((item) => {
                    const effectiveStatus = getEffectiveStatus(item.status, item.dueDate);

                    return (
                      <tr key={item.id} className="bg-white dark:bg-slate-900 align-top">
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800 dark:text-slate-200">{item.concept}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>{item.country}</span>
                            <span>·</span>
                            <span>{item.category === "TAX" ? "Impuesto" : item.category === "FEE" ? "Tasa" : item.category === "CONTRIBUTION" ? "Aporte / carga" : item.category === "SERVICE" ? "Servicio" : item.category === "RENT" ? "Alquiler / expensa" : item.category === "FILING" ? "Presentacion" : "Otro"}</span>
                            {item.case && (
                              <>
                                <span>·</span>
                                <span>{item.case.caratula}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          <Link href={`/client/${item.client.id}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                            {item.client.lastName}, {item.client.firstName}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{item.organism}</td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{item.period || "-"}</td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                            {item.dueDate.toLocaleDateString("es-AR")}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right font-mono text-slate-700 dark:text-slate-200">
                          {item.amount ? `$ ${item.amount.toLocaleString("es-AR")}` : "-"}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase ${getStatusClass(effectiveStatus)}`}>
                            {getStatusLabel(effectiveStatus)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-2">
                            {item.status !== "PAID" && (
                              <form action={submitStatusChange}>
                                <input type="hidden" name="id" value={item.id} />
                                <input type="hidden" name="status" value="PAID" />
                                <Button type="submit" size="sm" className="w-full justify-start gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Marcar pagada
                                </Button>
                              </form>
                            )}

                            {item.status !== "FILED" && item.status !== "PAID" && (
                              <form action={submitStatusChange}>
                                <input type="hidden" name="id" value={item.id} />
                                <input type="hidden" name="status" value="FILED" />
                                <Button type="submit" size="sm" variant="outline" className="w-full justify-start gap-2">
                                  <ShieldCheck className="h-3.5 w-3.5" /> Marcar presentada
                                </Button>
                              </form>
                            )}

                            {item.status !== "PENDING" && (
                              <form action={submitStatusChange}>
                                <input type="hidden" name="id" value={item.id} />
                                <input type="hidden" name="status" value="PENDING" />
                                <Button type="submit" size="sm" variant="outline" className="w-full justify-start gap-2">
                                  <AlertTriangle className="h-3.5 w-3.5" /> Volver a pendiente
                                </Button>
                              </form>
                            )}

                            <form action={submitDelete}>
                              <input type="hidden" name="id" value={item.id} />
                              <Button type="submit" size="sm" variant="outline" className="w-full justify-start gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-950/20">
                                <Trash2 className="h-3.5 w-3.5" /> Eliminar
                              </Button>
                            </form>

                            {item.case && (
                              <Link href={`/client/${item.client.id}/case/${item.case.id}`} className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                Abrir expediente
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
