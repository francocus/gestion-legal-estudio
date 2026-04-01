"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, CartesianGrid } from "recharts";

interface CashFlowDataPoint {
  name: string;
  Ingresos: number;
  Egresos: number;
}

interface ChartProps {
  data: CashFlowDataPoint[];
}

type TooltipValue = number | string | readonly (number | string)[] | undefined;

export function CashFlowChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
        <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#64748b' }}
            dy={10}
        />
        <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickFormatter={(value) => `$${value >= 1000 ? (value / 1000) + 'k' : value}`}
        />
        <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: TooltipValue) => {
              const amount = Array.isArray(value) ? value[0] : value;
              return [`$ ${Number(amount ?? 0).toLocaleString('es-AR')}`, "Monto"];
            }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px' }}/>
        <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
        <Bar dataKey="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
      </BarChart>
    </ResponsiveContainer>
  );
}
