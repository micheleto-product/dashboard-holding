import { getHoldingSummary } from "./holding";
import { formatValue, formatDelta } from "./format";
import { periodLabel, type PeriodState } from "./period";

export type AssistantReply = { text: string; bullets?: string[] | undefined; recommendation?: string | undefined };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Answers executive questions from the dashboard's (sample) data. */
export function answer(question: string, period: PeriodState): AssistantReply {
  const q = norm(question);
  const { items, totals, change } = getHoldingSummary(period);
  const p = periodLabel(period).toLowerCase();
  const by = <K extends keyof (typeof items)[number]>(k: K, asc = false) =>
    [...items].sort((a, b) => (asc ? 1 : -1) * ((a[k] as number) - (b[k] as number)));

  if (q.includes("roas") || q.includes("retorno")) {
    const r = by("roas");
    return {
      text: `No período (${p}), o ROAS global da holding é ${formatValue(totals.roas, "multiplier")} (${formatDelta(change.roas)} vs. período anterior).`,
      bullets: r.map((s, i) => `${i + 1}º ${s.brand.name}: ${formatValue(s.roas, "multiplier")} — investimento de ${formatValue(s.investment, "currency")}`),
      recommendation: `Avaliar realocar verba incremental para ${r[0]!.brand.name}, que tem o melhor retorno, e revisar a eficiência de mídia de ${r[r.length - 1]!.brand.name}.`,
    };
  }
  if (q.includes("cac") || q.includes("custo de aquisicao")) {
    const r = by("cac", true);
    return {
      text: `O CAC médio ponderado do grupo está em ${formatValue(totals.cac, "currency")} (${formatDelta(change.cac)}).`,
      bullets: r.map((s) => `${s.brand.name}: ${formatValue(s.cac, "currency")} (${formatDelta(s.change.cac)})`),
      recommendation: `${r[r.length - 1]!.brand.name} tem o CAC mais alto — vale investigar taxa de conversão do funil e qualidade dos leads.`,
    };
  }
  if (q.includes("meta") || q.includes("saude") || q.includes("risco") || q.includes("critic") || q.includes("atencao")) {
    const r = by("goalPct", true);
    const risk = r.filter((s) => s.health.tone !== "success");
    return {
      text: risk.length
        ? `${risk.length} de ${items.length} empresas estão abaixo da meta no período (${p}).`
        : `Todas as empresas estão dentro da meta no período (${p}).`,
      bullets: r.map((s) => `${s.brand.name}: ${formatValue(s.goalPct, "percent")} da meta — ${s.health.label}`),
      recommendation: risk.length ? `Priorizar um plano de recuperação para ${risk[0]!.brand.name}, começando pela página RevOps & Comercial.` : undefined,
    };
  }
  if (q.includes("lead")) {
    const r = by("qualifiedLeads");
    return {
      text: `A holding gerou ${formatValue(totals.qualifiedLeads, "number", { compact: false })} leads qualificados (${formatDelta(change.leads)}).`,
      bullets: r.map((s) => `${s.brand.name}: ${formatValue(s.qualifiedLeads, "number", { compact: false })} leads qualificados de ${formatValue(s.leads, "number", { compact: false })} totais`),
    };
  }
  if (q.includes("invest") || q.includes("verba") || q.includes("orcamento")) {
    const r = by("investment");
    return {
      text: `O investimento total em marketing foi de ${formatValue(totals.investment, "currency")} (${formatDelta(change.investment)}).`,
      bullets: r.map((s) => `${s.brand.name}: ${formatValue(s.investment, "currency")} — ${((s.investment / totals.investment) * 100).toFixed(0)}% do total`),
    };
  }
  const r = by("revenue");
  return {
    text: `Resumo do período (${p}): receita consolidada de ${formatValue(totals.revenue, "currency")} (${formatDelta(change.revenue)}), com ROAS de ${formatValue(totals.roas, "multiplier")} e CAC médio de ${formatValue(totals.cac, "currency")}.`,
    bullets: r.map((s) => `${s.brand.name}: ${formatValue(s.revenue, "currency")} de receita · ${formatValue(s.goalPct, "percent")} da meta · ${s.health.label}`),
    recommendation: `Pergunte sobre ROAS, CAC, metas, leads ou investimento para aprofundar a análise.`,
  };
}
