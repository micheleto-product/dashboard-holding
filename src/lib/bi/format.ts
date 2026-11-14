export type ValueFormat = "currency" | "number" | "percent" | "days" | "multiplier" | "position" | "score";

const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export function formatValue(value: number, fmt: ValueFormat, opts: { compact?: boolean } = {}): string {
  const useCompact = opts.compact ?? true;
  switch (fmt) {
    case "currency":
      if (useCompact && Math.abs(value) >= 10_000) return `R$ ${compact.format(value)}`;
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: value < 100 ? 2 : 0 }).format(value);
    case "number":
      return useCompact && Math.abs(value) >= 10_000 ? compact.format(value) : integer.format(value);
    case "percent":
      return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`;
    case "days":
      return `${integer.format(value)} dias`;
    case "multiplier":
      return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}x`;
    case "position":
      return value.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
    case "score":
      return integer.format(value);
  }
}

export function formatDelta(change: number): string {
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`;
}
