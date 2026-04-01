import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Landmark,
  Briefcase,
  Building2,
  CircleDollarSign,
  ReceiptText,
  ExternalLink,
} from "lucide-react";
import { CashFlowChart } from "./cash-flow-chart";
import { CreateEntryDialog } from "@/components/create-entry-dialog";
import { AccountingPanel } from "@/components/accounting-panel";
import { HonorariosActions } from "@/components/honorarios-actions";
import { PrestamosActions } from "@/components/prestamos-actions";

export const dynamic = "force-dynamic";

function normalizeConcept(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

function getUtcMonthKey(dateValue: Date) {
  const date = new Date(dateValue);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getUtcMonthLabelFromKey(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1))
    .toLocaleDateString("es-AR", { month: "short", timeZone: "UTC" })
    .toUpperCase();
}

function matchesCategory(concept: string, category: "HONORARIOS" | "ALQUILERES_OBRAS" | "PRESTAMOS") {
  const normalized = normalizeConcept(concept);

  if (category === "HONORARIOS") return normalized.includes("HONORARIO");
  if (category === "ALQUILERES_OBRAS") {
    return (
      normalized.includes("ALQUILER") ||
      normalized.includes("OBRA") ||
      normalized.includes("EXPENSA") ||
      normalized.includes("INMOBILI")
    );
  }

  return (
    normalized.includes("PRESTAMO") ||
    normalized.includes("MUTUO") ||
    normalized.includes("CREDITO") ||
    normalized.includes("COBRANZA")
  );
}

export default async function ContabilidadPage() {
  const entries = await db.accountEntry.findMany({
    orderBy: { date: "desc" },
    include: { case: true },
  });
  const casesWithAccounting = await db.case.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      entries: {
        orderBy: { date: "desc" },
      },
    },
  });

  const totalIngresos = entries.reduce((acc, curr) => acc + (curr.haber || 0), 0);
  const totalGastos = entries.reduce((acc, curr) => acc + (curr.debe || 0), 0);
  const balanceTotal = totalIngresos - totalGastos;

  const now = new Date();
  const currentMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const entriesThisMonth = entries.filter((entry) => {
    return getUtcMonthKey(entry.date) === currentMonthKey;
  });

  const ingresosMes = entriesThisMonth.reduce((acc, curr) => acc + (curr.haber || 0), 0);
  const gastosMes = entriesThisMonth.reduce((acc, curr) => acc + (curr.debe || 0), 0);
  const balanceMes = ingresosMes - gastosMes;

  const monthlyDataMap = new Map<string, { name: string; Ingresos: number; Egresos: number }>();
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1));
    const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    monthlyDataMap.set(monthKey, {
      name: getUtcMonthLabelFromKey(monthKey),
      Ingresos: 0,
      Egresos: 0,
    });
  }

  entries.forEach((entry) => {
    const monthKey = getUtcMonthKey(entry.date);
    if (monthlyDataMap.has(monthKey)) {
      const current = monthlyDataMap.get(monthKey);
      if (current) {
        current.Ingresos += entry.haber || 0;
        current.Egresos += entry.debe || 0;
      }
    }
  });

  const chartData = Array.from(monthlyDataMap.values());

  const categorySummary = [
    {
      key: "HONORARIOS" as const,
      title: "Honorarios",
      icon: Briefcase,
      description: "Cobros profesionales, adelantos y recupero por expedientes.",
    },
    {
      key: "ALQUILERES_OBRAS" as const,
      title: "Alquileres / Obras",
      icon: Building2,
      description: "Locaciones, inmuebles, expensas, obras y proveedores.",
    },
    {
      key: "PRESTAMOS" as const,
      title: "Creditos / Cobranzas",
      icon: CircleDollarSign,
      description: "Entregas de fondos, recuperos y seguimiento de saldos.",
    },
  ].map((item) => {
    const filtered = entries.filter((entry) => matchesCategory(entry.concept, item.key));
    const ingresos = filtered.reduce((sum, entry) => sum + entry.haber, 0);
    const egresos = filtered.reduce((sum, entry) => sum + entry.debe, 0);
    return {
      ...item,
      count: filtered.length,
      ingresos,
      egresos,
      saldo: ingresos - egresos,
    };
  });

  const honorariosPorCaso = casesWithAccounting
    .map((legalCase) => {
      const pactado = legalCase.totalFee || 0;
      const cobrado = legalCase.entries
        .filter((entry) => matchesCategory(entry.concept, "HONORARIOS"))
        .reduce((sum, entry) => sum + (entry.haber || 0), 0);
      const invertido = legalCase.entries
        .filter((entry) => matchesCategory(entry.concept, "HONORARIOS"))
        .reduce((sum, entry) => sum + (entry.debe || 0), 0);
      const pendiente = Math.max(pactado - cobrado, 0);
      const avance = pactado > 0 ? Math.min((cobrado / pactado) * 100, 100) : 0;

      return {
        id: legalCase.id,
        clientId: legalCase.client.id,
        caratula: legalCase.caratula,
        clientName: `${legalCase.client.lastName}, ${legalCase.client.firstName}`,
        area: legalCase.area,
        pactado,
        cobrado,
        invertido,
        pendiente,
        avance,
        status: legalCase.status,
      };
    })
    .filter((item) => item.pactado > 0 || item.cobrado > 0 || item.invertido > 0);

  const honorariosPactados = honorariosPorCaso.reduce((sum, item) => sum + item.pactado, 0);
  const honorariosCobrados = honorariosPorCaso.reduce((sum, item) => sum + item.cobrado, 0);
  const honorariosPendientes = honorariosPorCaso.reduce((sum, item) => sum + item.pendiente, 0);
  const honorariosEnRiesgo = honorariosPorCaso.filter((item) => item.pactado > 0 && item.avance < 40).length;
  const prestamosPorCaso = casesWithAccounting
    .map((legalCase) => {
      const entregado = legalCase.entries
        .filter((entry) => matchesCategory(entry.concept, "PRESTAMOS") && entry.debe > 0)
        .reduce((sum, entry) => sum + (entry.debe || 0), 0);
      const recuperado = legalCase.entries
        .filter((entry) => matchesCategory(entry.concept, "PRESTAMOS") && entry.haber > 0)
        .reduce((sum, entry) => sum + (entry.haber || 0), 0);
      const saldo = entregado - recuperado;
      const movimientos = legalCase.entries.filter((entry) => matchesCategory(entry.concept, "PRESTAMOS")).length;

      return {
        id: legalCase.id,
        clientId: legalCase.client.id,
        caratula: legalCase.caratula,
        clientName: `${legalCase.client.lastName}, ${legalCase.client.firstName}`,
        area: legalCase.area,
        entregado,
        recuperado,
        saldo,
        movimientos,
      };
    })
    .filter((item) => item.entregado > 0 || item.recuperado > 0);

  const prestamosEntregados = prestamosPorCaso.reduce((sum, item) => sum + item.entregado, 0);
  const prestamosRecuperados = prestamosPorCaso.reduce((sum, item) => sum + item.recuperado, 0);
  const prestamosPendientes = prestamosPorCaso.reduce((sum, item) => sum + Math.max(item.saldo, 0), 0);
  const prestamosActivos = prestamosPorCaso.filter((item) => item.saldo > 0).length;
  const caseOptions = casesWithAccounting.map((legalCase) => ({
    id: legalCase.id,
    clientId: legalCase.client.id,
    caratula: legalCase.caratula,
    code: legalCase.code,
    clientName: `${legalCase.client.lastName}, ${legalCase.client.firstName}`,
  }));

  return (
    <div className="flex-1 w-full p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Resumen contable</h2>
          <p className="text-sm text-slate-500">
            Estado general de ingresos, egresos y rubros del estudio.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <CreateEntryDialog cases={caseOptions} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Saldo general</CardTitle>
            <Wallet className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">$ {balanceTotal.toLocaleString("es-AR")}</div>
            <p className="text-xs text-slate-500 mt-1">Resultado acumulado de todos los movimientos</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Ingresos del mes</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">$ {ingresosMes.toLocaleString("es-AR")}</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Gastos del mes</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">$ {gastosMes.toLocaleString("es-AR")}</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Resultado del mes</CardTitle>
            <Landmark className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balanceMes >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              $ {balanceMes.toLocaleString("es-AR")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-slate-900/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Evolucion mensual (ultimos 6 meses)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <CashFlowChart data={chartData} />
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Honorarios</h3>
          <p className="text-sm text-slate-500">
            Estado economico por expediente.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-indigo-500">
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Honorarios pactados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">$ {honorariosPactados.toLocaleString("es-AR")}</div>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-emerald-500">
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Honorarios cobrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">$ {honorariosCobrados.toLocaleString("es-AR")}</div>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-amber-500">
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Pendiente de cobro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">$ {honorariosPendientes.toLocaleString("es-AR")}</div>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-red-500">
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Casos con baja cobranza</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{honorariosEnRiesgo}</div>
              <p className="text-xs text-slate-500 mt-1">Expedientes con menos del 40% cobrado</p>
            </CardContent>
          </Card>
        </div>

        <Card className="dark:bg-slate-900/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-indigo-500" /> Estado de honorarios por expediente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {honorariosPorCaso.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No hay expedientes con honorarios cargados todavia.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Expediente</th>
                      <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Cliente</th>
                      <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Area</th>
                      <th className="px-5 py-3 text-right text-[10px] uppercase tracking-widest text-slate-500">Pactado</th>
                      <th className="px-5 py-3 text-right text-[10px] uppercase tracking-widest text-slate-500">Cobrado</th>
                      <th className="px-5 py-3 text-right text-[10px] uppercase tracking-widest text-slate-500">Pendiente</th>
                      <th className="px-5 py-3 text-right text-[10px] uppercase tracking-widest text-slate-500">Invertido</th>
                      <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Avance</th>
                      <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {honorariosPorCaso.map((item) => (
                      <tr key={item.id} className="bg-white dark:bg-slate-900">
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800 dark:text-slate-200">{item.caratula}</p>
                          <p className="text-xs text-slate-500 uppercase mt-1">
                            {item.status === "ACTIVE" ? "En tramite" : item.status === "MEDIATION" ? "Mediacion" : "Archivado"}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{item.clientName}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {item.area}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-mono text-slate-700 dark:text-slate-200">$ {item.pactado.toLocaleString("es-AR")}</td>
                        <td className="px-5 py-4 text-right font-mono text-emerald-600 dark:text-emerald-400">$ {item.cobrado.toLocaleString("es-AR")}</td>
                        <td className="px-5 py-4 text-right font-mono text-amber-600 dark:text-amber-400">$ {item.pendiente.toLocaleString("es-AR")}</td>
                        <td className="px-5 py-4 text-right font-mono text-red-600 dark:text-red-400">$ {item.invertido.toLocaleString("es-AR")}</td>
                        <td className="px-5 py-4 min-w-[180px]">
                          <div className="space-y-1">
                            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${item.avance >= 70 ? "bg-emerald-500" : item.avance >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                                style={{ width: `${item.avance}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-500">{item.avance.toFixed(0)}% cobrado</p>
                          </div>
                        </td>
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
                            <HonorariosActions
                              caseId={item.id}
                              clientId={item.clientId}
                              caratula={item.caratula}
                              clientName={item.clientName}
                              totalFee={item.pactado}
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
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">$ {prestamosEntregados.toLocaleString("es-AR")}</div>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-emerald-500">
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Capital recuperado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">$ {prestamosRecuperados.toLocaleString("es-AR")}</div>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-red-500">
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Saldo pendiente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">$ {prestamosPendientes.toLocaleString("es-AR")}</div>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-900/50 shadow-sm border-l-4 border-l-blue-500">
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Casos activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{prestamosActivos}</div>
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
            {prestamosPorCaso.length === 0 ? (
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
                    {prestamosPorCaso.map((item) => (
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

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Rubros contables</h3>
          <p className="text-sm text-slate-500">
            Resumen por rubro.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {categorySummary.map((item) => {
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

      <AccountingPanel
        initialEntries={entries}
        availableCases={caseOptions}
        showCaseColumn={true}
        showSummaryCards={false}
        showChart={false}
        showQuickEntry={false}
        showCategoryFilters={true}
        ledgerTitle="Registro de movimientos"
      />
    </div>
  );
}
