import type { ValueFormat } from "./format";

export type Tone = "success" | "warning" | "danger" | "neutral";

export type Kpi = {
  label: string;
  value: number;
  format: ValueFormat;
  /** % change vs. previous period */
  change: number;
  /** true when a lower value is better (CAC, CPA, cycle time…) */
  invert?: boolean;
  spark: number[];
};

export type Series = { key: string; label: string; color: 1 | 2 | 3 | 4 | 5; type?: "bar" | "line" };

export type TimeChart = {
  kind: "area" | "bar" | "line" | "composed";
  title: string;
  subtitle?: string;
  data: Record<string, number | string>[];
  series: Series[];
  stacked?: boolean;
  format: ValueFormat;
  /** format for the secondary (right) axis when a composed chart mixes units */
  rightFormat?: ValueFormat;
};

export type CategoryChart = {
  kind: "donut" | "funnel" | "hbar" | "vbar";
  title: string;
  subtitle?: string;
  data: { name: string; value: number; secondary?: number }[];
  format: ValueFormat;
  secondaryLabel?: string;
  valueLabel?: string;
};

export type ChartSpec = TimeChart | CategoryChart;

export type Column = {
  key: string;
  label: string;
  format?: ValueFormat | "text" | "status" | "delta";
  tones?: Record<string, Tone>;
  align?: "left" | "right";
};

export type TableSpec = {
  title: string;
  subtitle?: string;
  columns: Column[];
  rows: Record<string, string | number>[];
};

export type SectionData = {
  kpis: Kpi[];
  charts: [ChartSpec, ChartSpec];
  table: TableSpec;
};
