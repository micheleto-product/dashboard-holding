import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useId } from "react";
import { formatValue } from "@/lib/bi/format";
import type { Kpi } from "@/lib/bi/types";
import { Delta } from "./delta";

export function KpiCard({ kpi, index = 0 }: { kpi: Kpi; index?: number }) {
  const id = useId().replace(/:/g, "");
  const good = kpi.invert ? kpi.change <= 0 : kpi.change >= 0;
  const color = good ? "var(--chart-1)" : "var(--destructive)";
  const data = kpi.spark.map((v, i) => ({ i, v }));
  return (
    <div className="surface animate-fade-up relative overflow-hidden p-4" style={{ animationDelay: `${index * 40}ms` }}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
        <Delta change={kpi.change} invert={kpi.invert} />
      </div>
      <p className="num mt-2 text-2xl font-semibold tracking-tight">{formatValue(kpi.value, kpi.format)}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">vs. período anterior</p>
      <div className="pointer-events-none -mx-4 -mb-4 mt-2 h-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`k${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#k${id})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function KpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {kpis.map((k, i) => (
        <KpiCard key={k.label} kpi={k} index={i} />
      ))}
    </div>
  );
}
