import { BRANDS, brandGoalBias, brandScale, type Brand } from "./brands";
import { periodBuckets, periodFactor, periodSeed, type PeriodState } from "./period";
import { seeded } from "./rng";
import type { Tone } from "./types";

export type Health = { label: "Saudável" | "Atenção" | "Crítico"; tone: Tone };

/** Health badge from goal attainment: ≥95% healthy, ≥80% attention, below that critical. */
export function healthFromGoal(goalPct: number): Health {
  if (goalPct >= 95) return { label: "Saudável", tone: "success" };
  if (goalPct >= 80) return { label: "Atenção", tone: "warning" };
  return { label: "Crítico", tone: "danger" };
}

export type BrandSummary = {
  brand: Brand;
  revenue: number;
  investment: number;
  leads: number;
  qualifiedLeads: number;
  cac: number;
  roas: number;
  goalPct: number;
  health: Health;
  revenueSeries: number[];
  investmentSeries: number[];
  change: { revenue: number; investment: number; cac: number; roas: number; leads: number };
};

export function getBrandSummary(brand: Brand, period: PeriodState): BrandSummary {
  const rng = seeded(`summary:${brand.id}:${periodSeed(period)}`);
  const vol = brandScale(brand) * periodFactor(period);
  const revenue = rng.vary(2_350_000, 0.05) * vol * (brandGoalBias(brand) / 100);
  const investment = rng.vary(310_000, 0.06) * vol;
  const leads = Math.round(rng.vary(5200, 0.08) * vol);
  const qualifiedLeads = Math.round(leads * rng.range(0.36, 0.46));
  const customers = Math.max(1, Math.round(qualifiedLeads * rng.range(0.14, 0.2) * (brandGoalBias(brand) / 100)));
  const goalPct = Math.round(brandGoalBias(brand) * rng.vary(1, 0.025) * 10) / 10;
  const n = periodBuckets(period).length;
  const shape = (total: number, trend: number) => {
    const raw = Array.from({ length: n }, (_, i) => (1 + trend * (i / Math.max(1, n - 1) - 0.5)) * rng.vary(1, 0.14));
    const s = raw.reduce((a, b) => a + b, 0);
    return raw.map((r) => (r / s) * total);
  };
  const bias = (brandGoalBias(brand) - 90) / 3;
  return {
    brand,
    revenue,
    investment,
    leads,
    qualifiedLeads,
    cac: investment / customers,
    roas: revenue / investment,
    goalPct,
    health: healthFromGoal(goalPct),
    revenueSeries: shape(revenue, 0.3 + bias / 40),
    investmentSeries: shape(investment, 0.15),
    change: {
      revenue: Math.round((rng.range(-4, 12) + bias) * 10) / 10,
      investment: Math.round(rng.range(-3, 14) * 10) / 10,
      cac: Math.round((rng.range(-8, 6) - bias / 2) * 10) / 10,
      roas: Math.round((rng.range(-5, 10) + bias / 2) * 10) / 10,
      leads: Math.round((rng.range(-4, 15) + bias / 2) * 10) / 10,
    },
  };
}

export function getHoldingSummary(period: PeriodState, brands: Brand[] = BRANDS) {
  const items = brands.map((b) => getBrandSummary(b, period));
  const sum = (f: (s: BrandSummary) => number) => items.reduce((a, s) => a + f(s), 0);
  const revenue = sum((s) => s.revenue);
  const investment = sum((s) => s.investment);
  const weighted = (f: (s: BrandSummary) => number, w: (s: BrandSummary) => number) => sum((s) => f(s) * w(s)) / Math.max(1, sum(w));
  return {
    items,
    totals: {
      revenue,
      investment,
      cac: weighted((s) => s.cac, (s) => s.qualifiedLeads),
      roas: revenue / investment,
      qualifiedLeads: sum((s) => s.qualifiedLeads),
    },
    change: {
      revenue: weighted((s) => s.change.revenue, (s) => s.revenue),
      investment: weighted((s) => s.change.investment, (s) => s.investment),
      cac: weighted((s) => s.change.cac, (s) => s.qualifiedLeads),
      roas: weighted((s) => s.change.roas, (s) => s.revenue),
      leads: weighted((s) => s.change.leads, (s) => s.qualifiedLeads),
    },
  };
}
