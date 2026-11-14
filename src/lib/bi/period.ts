import { differenceInCalendarDays, format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export type PeriodKey = "today" | "7d" | "30d" | "quarter" | "year" | "custom";
export type DateRange = { from: Date; to: Date };
export type PeriodState = { key: PeriodKey; range?: DateRange };

export const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "7d", label: "Últimos 7 dias" },
  { key: "30d", label: "Últimos 30 dias" },
  { key: "quarter", label: "Este Trimestre" },
  { key: "year", label: "Este Ano" },
  { key: "custom", label: "Personalizado" },
];

/** Number of days the period covers. */
export function periodDays(p: PeriodState): number {
  switch (p.key) {
    case "today":
      return 1;
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "quarter":
      return 90;
    case "year":
      return 365;
    case "custom":
      return p.range ? Math.max(1, differenceInCalendarDays(p.range.to, p.range.from) + 1) : 30;
  }
}

/** Multiplier vs. a 30-day baseline for volume metrics. */
export function periodFactor(p: PeriodState): number {
  return periodDays(p) / 30;
}

/** X-axis labels for time-series charts. */
export function periodBuckets(p: PeriodState): string[] {
  switch (p.key) {
    case "today":
      return ["00h", "03h", "06h", "09h", "12h", "15h", "18h", "21h"];
    case "7d":
      return ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    case "30d":
      return Array.from({ length: 15 }, (_, i) => `D${i * 2 + 1}`);
    case "quarter":
      return Array.from({ length: 13 }, (_, i) => `S${i + 1}`);
    case "year":
      return ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    case "custom": {
      if (!p.range) return periodBuckets({ key: "30d" });
      const days = periodDays(p);
      const step = Math.max(1, Math.ceil(days / 14));
      const out: string[] = [];
      for (let d = 0; d < days; d += step) out.push(format(addDays(p.range.from, d), "dd/MM", { locale: ptBR }));
      return out;
    }
  }
}

export function periodLabel(p: PeriodState): string {
  if (p.key === "custom" && p.range) {
    return `${format(p.range.from, "dd MMM", { locale: ptBR })} – ${format(p.range.to, "dd MMM", { locale: ptBR })}`;
  }
  return PERIOD_OPTIONS.find((o) => o.key === p.key)?.label ?? "";
}

export function periodSeed(p: PeriodState): string {
  return p.key === "custom" && p.range ? `c${p.range.from.toDateString()}-${p.range.to.toDateString()}` : p.key;
}
