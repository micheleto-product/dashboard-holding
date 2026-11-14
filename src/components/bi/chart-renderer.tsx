import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { formatValue, type ValueFormat } from "@/lib/bi/format";
import type { CategoryChart, ChartSpec, Series, TimeChart } from "@/lib/bi/types";

const c = (n: number) => `var(--chart-${n})`;

const axisProps = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

function ChartTooltip({ active, payload, label, format }: TooltipProps<number, string> & { format: ValueFormat }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
      {label && <p className="mb-1.5 font-medium">{label}</p>}
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={String(p.dataKey ?? p.name)} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-sm" style={{ background: (p.payload?.fill as string) ?? p.color }} />
              {p.name}
            </span>
            <span className="num font-medium">{formatValue(Number(p.value), format)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="size-2 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function TimeChartView({ spec }: { spec: TimeChart }) {
  const tick = (v: number) => formatValue(v, spec.format);
  const common = { data: spec.data, margin: { top: 14, right: 4, bottom: 0, left: 0 } };
  const grid = <CartesianGrid vertical={false} stroke="var(--border)" />;
  const x = <XAxis dataKey="label" {...axisProps} minTickGap={12} />;
  const y = <YAxis {...axisProps} width={spec.format === "currency" ? 80 : 56} tickFormatter={tick} />;
  const tip = <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<ChartTooltip format={spec.format} />} />;
  const stackProps = spec.stacked ? { stackId: "s" } : {};

  const renderSeries = (s: Series, i: number, kind: "area" | "bar" | "line") => {
    if (kind === "area")
      return (
        <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} {...stackProps} stroke={c(s.color)} strokeWidth={1.75} fill={`url(#g-${s.key})`} />
      );
    if (kind === "bar")
      return (
        <Bar
          key={s.key}
          dataKey={s.key}
          name={s.label}
          {...stackProps}
          fill={c(s.color)}
          radius={spec.stacked ? (i === spec.series.length - 1 ? [3, 3, 0, 0] : 0) : [3, 3, 0, 0]}
          maxBarSize={28}
        />
      );
    return <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={c(s.color)} strokeWidth={2} dot={false} strokeDasharray={s.key === "meta" || s.key === "benchmark" ? "4 4" : undefined} />;
  };

  let chart;
  if (spec.kind === "area") {
    chart = (
      <AreaChart {...common}>
        <defs>
          {spec.series.map((s) => (
            <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c(s.color)} stopOpacity={spec.stacked ? 0.5 : 0.35} />
              <stop offset="100%" stopColor={c(s.color)} stopOpacity={spec.stacked ? 0.15 : 0} />
            </linearGradient>
          ))}
        </defs>
        {grid}
        {x}
        {y}
        {tip}
        {spec.series.map((s, i) => renderSeries(s, i, "area"))}
      </AreaChart>
    );
  } else if (spec.kind === "bar") {
    chart = (
      <BarChart {...common}>
        {grid}
        {x}
        {y}
        {tip}
        {spec.series.map((s, i) => renderSeries(s, i, "bar"))}
      </BarChart>
    );
  } else if (spec.kind === "line") {
    chart = (
      <LineChart {...common}>
        {grid}
        {x}
        {y}
        {tip}
        {spec.series.map((s, i) => renderSeries(s, i, "line"))}
      </LineChart>
    );
  } else {
    chart = (
      <ComposedChart {...common}>
        {grid}
        {x}
        {y}
        {tip}
        {spec.series.map((s, i) => renderSeries(s, i, s.type === "line" ? "line" : "bar"))}
      </ComposedChart>
    );
  }

  return (
    <>
      <Legend items={spec.series.map((s) => ({ label: s.label, color: c(s.color) }))} />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chart}
        </ResponsiveContainer>
      </div>
    </>
  );
}

function Funnel({ spec }: { spec: CategoryChart }) {
  const max = spec.data[0]?.value || 1;
  return (
    <div className="flex h-[17.5rem] flex-col justify-center gap-2.5">
      {spec.data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const prev = spec.data[i - 1];
        const step = prev ? (d.value / prev.value) * 100 : null;
        return (
          <div key={d.name} className="grid grid-cols-[5rem_1fr_4.5rem_3.5rem] items-center gap-3">
            <span className="text-xs text-muted-foreground">{d.name}</span>
            <div className="h-7 overflow-hidden rounded-md bg-muted">
              <div className="h-full rounded-md transition-all" style={{ width: `${Math.max(pct, 2)}%`, background: c((i % 5) + 1) }} />
            </div>
            <span className="num text-right text-xs font-semibold">{formatValue(d.value, spec.format)}</span>
            <span className="num text-right text-[11px] text-muted-foreground">{step === null ? "100%" : `${step.toFixed(1).replace(".", ",")}%`}</span>
          </div>
        );
      })}
      <p className="mt-1 text-right text-[11px] text-muted-foreground">Conversão entre etapas</p>
    </div>
  );
}

function Donut({ spec }: { spec: CategoryChart }) {
  const total = spec.data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="grid h-[17.5rem] grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_1fr]">
      <div className="relative h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTooltip format={spec.format} />} />
            <Pie data={spec.data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="var(--card)" strokeWidth={2}>
              {spec.data.map((d, i) => (
                <Cell key={d.name} fill={c((i % 5) + 1)} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {spec.format !== "percent" && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="eyebrow">Total</span>
            <span className="num text-lg font-semibold">{formatValue(total, spec.format)}</span>
          </div>
        )}
      </div>
      <ul className="space-y-2.5">
        {spec.data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-2 whitespace-nowrap text-muted-foreground">
              <span className="size-2.5 rounded-sm" style={{ background: c((i % 5) + 1) }} />
              {d.name}
            </span>
            <span className="num whitespace-nowrap font-medium">
              {formatValue(d.value, spec.format)}
              {spec.format !== "percent" && <span className="ml-2 text-muted-foreground">{((d.value / total) * 100).toFixed(0)}%</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CategoryBars({ spec }: { spec: CategoryChart }) {
  const horizontal = spec.kind === "hbar";
  const hasSecondary = spec.data.some((d) => d.secondary !== undefined);
  const tick = (v: number) => formatValue(v, spec.format);
  return (
    <>
      <Legend
        items={[
          { label: spec.valueLabel ?? "Valor", color: c(hasSecondary ? 4 : 1) },
          ...(hasSecondary ? [{ label: spec.secondaryLabel ?? "", color: c(1) }] : []),
        ]}
      />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={spec.data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 14, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid horizontal={!horizontal} vertical={horizontal} stroke="var(--border)" />
            {horizontal ? (
              <>
                <XAxis type="number" {...axisProps} tickFormatter={tick} />
                <YAxis type="category" dataKey="name" {...axisProps} width={84} />
              </>
            ) : (
              <>
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} width={spec.format === "currency" ? 80 : 56} tickFormatter={tick} />
              </>
            )}
            <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<ChartTooltip format={spec.format} />} />
            <Bar dataKey="value" name={spec.valueLabel ?? "Valor"} fill={c(hasSecondary ? 4 : 1)} radius={horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0]} maxBarSize={horizontal ? 18 : 36} />
            {hasSecondary && <Bar dataKey="secondary" name={spec.secondaryLabel ?? ""} fill={c(1)} radius={[3, 3, 0, 0]} maxBarSize={36} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

export function ChartRenderer({ spec }: { spec: ChartSpec }) {
  switch (spec.kind) {
    case "funnel":
      return <Funnel spec={spec} />;
    case "donut":
      return <Donut spec={spec} />;
    case "hbar":
    case "vbar":
      return <CategoryBars spec={spec} />;
    default:
      return <TimeChartView spec={spec} />;
  }
}
