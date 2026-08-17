"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createAccountEntry, deleteAccountEntry } from "@/lib/actions/accounting";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreateEntryDialog } from "@/components/create-entry-dialog";
import { EditEntryDialog } from "@/components/edit-entry-dialog";
import { AccountingCategory, matchesCategory } from "@/lib/accounting-categories";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Loader2,
  BookOpen,
  Scale,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

interface AccountEntry {
  id: string;
  date: Date;
  description: string;
  concept: string;
  debe: number;
  haber: number;
  caseId?: string | null;
  case?: { id?: string; clientId?: string; caratula: string; code: string | null } | null;
}

interface AccountingPanelProps {
  initialEntries: AccountEntry[];
  caseId?: string;
  availableCases?: Array<{
    id: string;
    clientId: string;
    caratula: string;
    code: string | null;
    clientName: string;
  }>;
  showCaseColumn?: boolean;
  showSummaryCards?: boolean;
  showChart?: boolean;
  showCategoryFilters?: boolean;
  showQuickEntry?: boolean;
  ledgerTitle?: string;
}

interface PieDataPoint {
  name: string;
  value: number;
}

type TooltipValue = number | string | readonly (number | string)[] | undefined;

const CONCEPTOS = [
  "Honorarios",
  "Adelanto de gastos",
  "Tasa judicial",
  "Sueldos / Personal",
  "Gastos bancarios",
  "Creditos / Cobranzas",
  "Cobro de credito",
  "Alquileres / Obras",
  "Impuestos",
  "Otros",
];

const COLORES_TORTA = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899"];

export function AccountingPanel({
  initialEntries,
  caseId,
  availableCases = [],
  showCaseColumn = false,
  showSummaryCards = true,
  showChart = true,
  showCategoryFilters = true,
  showQuickEntry = true,
  ledgerTitle = "Registro detallado de movimientos",
}: AccountingPanelProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<AccountingCategory>("TODOS");
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    concept: "Honorarios",
    debe: "",
    haber: "",
  });

  const filteredEntries = useMemo(
    () => entries.filter((entry) => matchesCategory(entry.concept, activeCategory)),
    [entries, activeCategory]
  );

  const totalHaber = filteredEntries.reduce((sum, entry) => sum + entry.haber, 0);
  const totalDebe = filteredEntries.reduce((sum, entry) => sum + entry.debe, 0);
  const saldo = totalHaber - totalDebe;

  const ingresosPorConcepto = filteredEntries.reduce<Record<string, number>>((acc, curr) => {
    if (curr.haber > 0) {
      acc[curr.concept] = (acc[curr.concept] || 0) + curr.haber;
    }
    return acc;
  }, {});

  const dataTorta: PieDataPoint[] = Object.keys(ingresosPorConcepto).map((key) => ({
    name: key,
    value: ingresosPorConcepto[key],
  }));

  const handleSubmit = async () => {
    if (!form.description.trim()) return;
    if (!form.debe && !form.haber) return;

    setIsSaving(true);
    setError(null);

    const result = await createAccountEntry({
      date: form.date,
      description: form.description,
      concept: form.concept,
      debe: parseFloat(form.debe) || 0,
      haber: parseFloat(form.haber) || 0,
      caseId,
    });

    if (!result.success) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    window.location.reload();
  };

  const handleDelete = async (id: string) => {
    await deleteAccountEntry(id, caseId);
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleExportCSV = () => {
    const headers = ["Fecha", "Rubro", "Descripcion", "Debe", "Haber", "Saldo"];
    let saldoProgresivo = 0;

    const sortedEntries = [...filteredEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const csvContent = [
      headers.join(";"),
      ...sortedEntries.map((entry) => {
        saldoProgresivo += (entry.haber || 0) - (entry.debe || 0);
        return [
          new Date(entry.date).toLocaleDateString("es-AR"),
          `"${entry.concept}"`,
          `"${entry.description.replace(/"/g, '""')}"`,
          entry.debe || 0,
          entry.haber || 0,
          saldoProgresivo,
        ].join(";");
      }),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Registro_Movimientos_${activeCategory.toLowerCase()}_${new Date().toLocaleDateString("es-AR").replace(/\//g, "-")}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {showSummaryCards && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="dark:bg-slate-900 dark:border-slate-800 border-l-4 border-l-emerald-500 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4" /> Ingresos (haber)
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">$ {totalHaber.toLocaleString("es-AR")}</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-900 dark:border-slate-800 border-l-4 border-l-red-500 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-red-500 flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4" /> Egresos (debe)
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">$ {totalDebe.toLocaleString("es-AR")}</p>
            </CardContent>
          </Card>

          <Card className={`dark:bg-slate-900 border-l-4 shadow-sm ${saldo >= 0 ? "border-l-indigo-500 dark:border-slate-800" : "border-l-red-500 dark:border-red-900/40"}`}>
            <CardContent className="p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-2">
                <Scale className="h-4 w-4" /> Saldo neto
              </p>
              <p className={`text-3xl font-bold ${saldo >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-red-500"}`}>
                {saldo >= 0 ? "+" : ""}$ {saldo.toLocaleString("es-AR")}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {(showChart || showQuickEntry) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {showChart && (
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-4">
                <PieChartIcon className="h-4 w-4" /> Origen de ingresos
              </h3>
              {dataTorta.length > 0 ? (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dataTorta} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {dataTorta.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value: TooltipValue) => {
                          const amount = Array.isArray(value) ? value[0] : value;
                          return [`$${Number(amount ?? 0).toLocaleString("es-AR")}`, "Monto"];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] flex flex-col items-center justify-center text-slate-400 text-sm text-center px-4 italic">
                  <PieChartIcon className="h-10 w-10 mb-2 opacity-20" />
                  No hay ingresos registrados para el periodo seleccionado.
                </div>
              )}
            </div>
          )}

          {showQuickEntry && (
            <div className={`${showChart ? "lg:col-span-2" : "lg:col-span-3"} bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center min-h-[300px]`}>
              {!isOpen ? (
                <div className="text-center py-8">
                  <Button onClick={() => setIsOpen(true)} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                    <Plus className="h-5 w-5 mr-2" /> Registrar nuevo movimiento
                  </Button>
                  <p className="text-sm text-slate-500 mt-3">Alta manual de ingresos y egresos.</p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nueva entrada contable</p>
                    <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)} className="h-8 text-xs">Cancelar</Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Fecha</label>
                      <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border rounded-lg dark:bg-slate-950 dark:border-slate-800 dark:text-white" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Concepto</label>
                      <select value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border rounded-lg dark:bg-slate-950 dark:border-slate-800 dark:text-white">
                        {CONCEPTOS.map((concept) => <option key={concept} value={concept}>{concept}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Descripcion</label>
                    <input type="text" placeholder="Ej: Pago de honorarios Perez" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border rounded-lg dark:bg-slate-950 dark:border-slate-800 dark:text-white" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-red-500 uppercase">Debe (egreso)</label>
                      <input type="number" placeholder="0.00" value={form.debe} onChange={(e) => setForm({ ...form, debe: e.target.value, haber: "" })} className="w-full mt-1 px-3 py-2 text-sm border border-red-200 focus:ring-1 focus:ring-red-400 rounded-lg dark:bg-slate-950 dark:text-white" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-emerald-600 uppercase">Haber (ingreso)</label>
                      <input type="number" placeholder="0.00" value={form.haber} onChange={(e) => setForm({ ...form, haber: e.target.value, debe: "" })} className="w-full mt-1 px-3 py-2 text-sm border border-emerald-200 focus:ring-1 focus:ring-emerald-400 rounded-lg dark:bg-slate-950 dark:text-white" />
                    </div>
                  </div>

                  <Button className="w-full bg-slate-900 dark:bg-slate-800 text-white" onClick={handleSubmit} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Guardar movimiento
                  </Button>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 dark:bg-slate-950 p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> {ledgerTitle}
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <CreateEntryDialog
              cases={availableCases}
              defaultCaseId={caseId}
              lockCaseSelection={Boolean(caseId)}
              triggerLabel="Nuevo movimiento"
              triggerVariant="default"
              triggerSize="sm"
              triggerClassName="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white"
            />

            {showCategoryFilters && (
              <>
                <Button variant={activeCategory === "HONORARIOS" ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setActiveCategory("HONORARIOS")}>
                  Honorarios
                </Button>
                <Button variant={activeCategory === "ALQUILERES_OBRAS" ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setActiveCategory("ALQUILERES_OBRAS")}>
                  Alquileres / Obras
                </Button>
                <Button variant={activeCategory === "PRESTAMOS" ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setActiveCategory("PRESTAMOS")}>
                  Creditos / Cobranzas
                </Button>
                <Button variant={activeCategory === "TODOS" ? "default" : "ghost"} size="sm" className="text-xs" onClick={() => setActiveCategory("TODOS")}>
                  Todos
                </Button>
              </>
            )}

            {filteredEntries.length > 0 && (
              <Button onClick={handleExportCSV} variant="outline" size="sm" className="text-xs h-8 bg-white dark:bg-slate-900 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar a Excel (.csv)
              </Button>
            )}
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
            <p className="text-slate-500">
              {entries.length === 0
                ? "No hay movimientos contables registrados."
                : "No hay movimientos para el filtro seleccionado."}
            </p>
            {!isOpen && showQuickEntry && (
              <Button onClick={() => setIsOpen(true)} variant="outline" className="mt-4 border-emerald-500 text-emerald-600 hover:bg-emerald-50">
                <Plus className="h-4 w-4 mr-2" /> Registrar movimiento
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Fecha</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Concepto</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Descripcion</th>
                  {showCaseColumn && <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Expediente</th>}
                  <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-red-500">Debe</th>
                  <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-emerald-600">Haber</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors bg-white dark:bg-slate-900 group">
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">{new Date(entry.date).toLocaleDateString("es-AR")}</td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">
                        {entry.concept}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300 font-medium">{entry.description}</td>
                    {showCaseColumn && (
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {entry.case ? (
                          <div className="space-y-1">
                            <p className="font-mono">{entry.case.code || "Sin numero"}</p>
                            {entry.case.id && entry.case.clientId && (
                              <Link
                                href={`/client/${entry.case.clientId}/case/${entry.case.id}`}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
                              >
                                Abrir expediente
                              </Link>
                            )}
                          </div>
                        ) : (
                          <span className="italic opacity-50">General</span>
                        )}
                      </td>
                    )}
                    <td className="px-5 py-4 text-right font-mono font-bold text-red-500">{entry.debe > 0 ? `$ ${entry.debe.toLocaleString("es-AR")}` : "-"}</td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-emerald-600">{entry.haber > 0 ? `$ ${entry.haber.toLocaleString("es-AR")}` : "-"}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end">
                        <EditEntryDialog
                          entry={entry}
                          cases={availableCases}
                          fixedCaseId={caseId}
                        />
                        <button onClick={() => handleDelete(entry.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 p-2">
                        <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
