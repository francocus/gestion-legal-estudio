import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Landmark,
  Briefcase,
  Building2,
  CircleDollarSign,
} from "lucide-react";
import { CashFlowChart } from "./cash-flow-chart";
import { CreateEntryDialog } from "@/components/create-entry-dialog";
import { AccountingPanel } from "@/components/accounting-panel";
import { TurnosSenasSection } from "@/components/contabilidad/turnos-senas-section";
import { HonorariosSection } from "@/components/contabilidad/honorarios-section";
import { CreditosSection } from "@/components/contabilidad/creditos-section";
import { RubrosSection } from "@/components/contabilidad/rubros-section";
import { matchesCategory } from "@/lib/accounting-categories";

export const dynamic = "force-dynamic";

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

export default async function ContabilidadPage() {
  const entries = await db.accountEntry.findMany({
    orderBy: { date: "desc" },
    include: { case: true },
  });
  const appointmentsWithDeposit = await db.event.findMany({
    where: {
      type: "APPOINTMENT",
      depositAmount: {
        not: null,
      },
    },
    orderBy: { date: "asc" },
    include: {
      client: true,
      case: true,
    },
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

  const balanceTotal = entries.reduce(
    (acc, curr) => acc + (curr.haber || 0) - (curr.debe || 0),
    0
  );

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
  const pendingAppointmentDeposits = appointmentsWithDeposit.filter((item) => !item.depositPaid);
  const paidAppointmentDeposits = appointmentsWithDeposit.filter((item) => item.depositPaid);
  const pendingAppointmentDepositAmount = pendingAppointmentDeposits.reduce((sum, item) => sum + (item.depositAmount || 0), 0);
  const paidAppointmentDepositAmount = paidAppointmentDeposits.reduce((sum, item) => sum + (item.depositAmount || 0), 0);
  const todayAppointmentsWithDeposit = appointmentsWithDeposit.filter((item) => {
    const itemDate = new Date(item.date);
    return (
      itemDate.getFullYear() === now.getFullYear() &&
      itemDate.getMonth() === now.getMonth() &&
      itemDate.getDate() === now.getDate()
    );
  }).length;
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

      <TurnosSenasSection
        appointments={appointmentsWithDeposit}
        pendingDepositAmount={pendingAppointmentDepositAmount}
        paidDepositAmount={paidAppointmentDepositAmount}
        todayCount={todayAppointmentsWithDeposit}
      />

      <HonorariosSection
        items={honorariosPorCaso}
        pactados={honorariosPactados}
        cobrados={honorariosCobrados}
        pendientes={honorariosPendientes}
        enRiesgo={honorariosEnRiesgo}
      />

      <CreditosSection
        items={prestamosPorCaso}
        entregados={prestamosEntregados}
        recuperados={prestamosRecuperados}
        pendientes={prestamosPendientes}
        activos={prestamosActivos}
      />

      <RubrosSection items={categorySummary} />

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
