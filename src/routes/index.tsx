import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppState } from "@/components/bi/app-state";
import { KpiGrid } from "@/components/bi/kpi-card";
import { PageHeader, Panel } from "@/components/bi/panel";
import { Delta } from "@/components/bi/delta";
import { BrandMark } from "@/components/bi/app-sidebar";
import { ChartRenderer, Legend } from "@/components/bi/chart-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getHoldingSummary } from "@/lib/bi/holding";
import { periodBuckets, periodLabel } from "@/lib/bi/period";
import { formatValue } from "@/lib/bi/format";
import type { Kpi } from "@/lib/bi/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Resumo Executivo · Holding Growth Intelligence" },
      { name: "description", content: "Visão consolidada de receita, investimento, CAC, ROAS e leads de todas as empresas da holding." },
      { property: "og:title", content: "Resumo Executivo · Holding Growth Intelligence" },
      { property: "og:description", content: "Saúde do grupo em uma tela: KPIs consolidados e comparativo por empresa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HoldingSummary,
});

function HoldingSummary() {
  const { period } = useAppState();
  const [metric, setMetric] = useState<"revenue" | "investment">("revenue");
  const data = useMemo(() => getHoldingSummary(period), [period]);
  const buckets = periodBuckets(period);

  const kpis: Kpi[] = [
    { label: "Receita Gerada", value: data.totals.revenue, format: "currency", change: data.change.revenue, spark: sumSeries(data.items.map((i) => i.revenueSeries)) },
    { label: "Investimento em Marketing", value: data.totals.investment, format: "currency", change: data.change.investment, spark: sumSeries(data.items.map((i) => i.investmentSeries)) },
    { label: "CAC Médio", value: data.totals.cac, format: "currency", change: data.change.cac, invert: true, spark: data.items.map((i) => i.cac) },
    { label: "ROAS Global", value: data.totals.roas, format: "multiplier", change: data.change.roas, spark: data.items.map((i) => i.roas) },
    { label: "Leads Qualificados", value: data.totals.qualifiedLeads, format: "number", change: data.change.leads, spark: data.items.map((i) => i.qualifiedLeads) },
  ];

  const evolution = buckets.map((label, idx) => {
    const row: Record<string, string | number> = { label };
    for (const it of data.items) row[it.brand.id] = Math.round((metric === "revenue" ? it.revenueSeries : it.investmentSeries)[idx] ?? 0);
    return row;
  });
  const roasTrend = buckets.map((label, idx) => {
    const row: Record<string, string | number> = { label };
    for (const it of data.items) row[it.brand.id] = Math.round(((it.revenueSeries[idx] ?? 0) / (it.investmentSeries[idx] || 1)) * 100) / 100;
    return row;
  });

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 p-4 md:p-6">
      <PageHeader eyebrow={`Visão Corporativa · ${periodLabel(period)}`} title="Resumo Executivo" description="Saúde consolidada do grupo e desempenho comparativo de cada empresa." />

      <KpiGrid kpis={kpis} />

      <Panel title="Comparativo por Empresa" subtitle="Indicadores-chave e status de saúde de cada marca da holding">
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-y bg-muted/40">
                {["Empresa", "Receita", "Meta Atingida", "Leads", "CAC", "ROAS", "Saúde", ""].map((h, i) => (
                  <th key={i} className={`eyebrow px-5 py-2 font-medium ${i > 0 && i < 6 ? "text-right" : "text-left"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((it) => (
                <tr key={it.brand.id} className="border-b transition-colors last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <BrandMark initials={it.brand.initials} />
                      <div className="leading-tight">
                        <p className="font-medium">{it.brand.name}</p>
                        <p className="text-[11px] text-muted-foreground">{it.brand.segment}</p>
                      </div>
                    </div>
                  </td>
                  <td className="num px-5 py-3 text-right">
                    <div className="font-medium">{formatValue(it.revenue, "currency")}</div>
                    <Delta change={it.change.revenue} className="mt-0.5" />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="ml-auto flex w-32 flex-col items-end gap-1.5">
                      <span className="num font-medium">{formatValue(it.goalPct, "percent")}</span>
                      <Progress value={Math.min(100, it.goalPct)} className="h-1.5" />
                    </div>
                  </td>
                  <td className="num px-5 py-3 text-right">{formatValue(it.qualifiedLeads, "number")}</td>
                  <td className="num px-5 py-3 text-right">{formatValue(it.cac, "currency")}</td>
                  <td className="num px-5 py-3 text-right">{formatValue(it.roas, "multiplier")}</td>
                  <td className="px-5 py-3">
                    <Badge variant={it.health.tone}>
                      <span className="mr-1.5 size-1.5 rounded-full bg-current" />
                      {it.health.label}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/marca/$brandId/$section" params={{ brandId: it.brand.id, section: "revops" }}>
                        Ver Detalhes da Marca <ArrowRight />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel
          title={metric === "revenue" ? "Evolução da Receita por Empresa" : "Evolução do Investimento por Empresa"}
          subtitle="Contribuição de cada marca ao longo do período"
          actions={
            <Tabs value={metric} onValueChange={(v) => setMetric(v as "revenue" | "investment")}>
              <TabsList className="h-8">
                <TabsTrigger value="revenue" className="text-xs">
                  Receita
                </TabsTrigger>
                <TabsTrigger value="investment" className="text-xs">
                  Investimento
                </TabsTrigger>
              </TabsList>
            </Tabs>
          }
        >
          <Legend items={data.items.map((it, i) => ({ label: it.brand.name, color: `var(--chart-${(i % 5) + 1})` }))} />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolution} margin={{ top: 14, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} minTickGap={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={80} tickFormatter={(v) => formatValue(v, "currency")} />
                <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<SimpleTooltip names={Object.fromEntries(data.items.map((i) => [i.brand.id, i.brand.name]))} format="currency" />} />
                {data.items.map((it, i) => (
                  <Bar key={it.brand.id} dataKey={it.brand.id} name={it.brand.name} stackId="s" fill={`var(--chart-${(i % 5) + 1})`} radius={i === data.items.length - 1 ? [3, 3, 0, 0] : 0} maxBarSize={32} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Participação na Receita" subtitle="Quanto cada empresa representa no faturamento do grupo">
          <ChartRenderer spec={{ kind: "donut", title: "", format: "currency", data: data.items.map((it) => ({ name: it.brand.name, value: it.revenue })) }} />
        </Panel>
      </div>

      <Panel title="ROAS por Empresa" subtitle="Retorno sobre o investimento em marketing ao longo do período">
        <Legend items={data.items.map((it, i) => ({ label: it.brand.name, color: `var(--chart-${(i % 5) + 1})` }))} />
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={roasTrend} margin={{ top: 14, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} minTickGap={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `${v}x`} />
              <Tooltip content={<SimpleTooltip names={Object.fromEntries(data.items.map((i) => [i.brand.id, i.brand.name]))} format="multiplier" />} />
              {data.items.map((it, i) => (
                <Line key={it.brand.id} type="monotone" dataKey={it.brand.id} name={it.brand.name} stroke={`var(--chart-${(i % 5) + 1})`} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}

function sumSeries(list: number[][]) {
  return (list[0] ?? []).map((_, i) => list.reduce((a, s) => a + (s[i] ?? 0), 0));
}

function SimpleTooltip({ active, payload, label, names, format }: { active?: boolean; payload?: { dataKey?: string | number; value?: number; color?: string }[]; label?: string; names: Record<string, string>; format: "currency" | "multiplier" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
      <p className="mb-1.5 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-sm" style={{ background: p.color }} />
            {names[String(p.dataKey)]}
          </span>
          <span className="num font-medium">{formatValue(Number(p.value), format)}</span>
        </div>
      ))}
    </div>
  );
}
