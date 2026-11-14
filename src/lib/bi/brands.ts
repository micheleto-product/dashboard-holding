/**
 * Holding brand registry. DEFAULT_BRANDS seeds the list; the user-managed list
 * (create / edit / archive) lives in AppStateProvider and is saved in the browser.
 * Every screen reads brands from app state, never from DEFAULT_BRANDS directly.
 */
export type Brand = {
  id: string;
  name: string;
  segment: string;
  initials: string;
  /** Identification color (hex), used in marks and holding comparison charts. */
  color: string;
  /** Optional lucide icon key from BRAND_ICONS; falls back to initials. */
  icon?: string | undefined;
  /** Optional logo as a small data URL. Takes precedence over icon. */
  logo?: string | undefined;
  /** Monthly revenue goal in BRL. Drives volume and goal attainment. */
  revenueGoal: number;
  /** Monthly marketing budget in BRL. */
  marketingBudget: number;
  /** Integration ids (see integrations.ts) enabled for this brand. */
  integrations: string[];
  archived?: boolean | undefined;
  /** Sample-data hint: typical goal attainment in %. Derived from the id when absent. */
  goalBias?: number | undefined;
};

/** Revenue goal of the reference brand: sample-data volumes scale against it. */
export const REFERENCE_REVENUE_GOAL = 2_350_000;

export const ALL_INTEGRATION_IDS = ["crm", "ga4", "gsc", "meta", "instagram", "facebook", "webhook"];

export const DEFAULT_BRANDS: Brand[] = [
  { id: "empresa-a", name: "Empresa A", segment: "Varejo & E-commerce", initials: "A", color: "#22c55e", icon: "store", revenueGoal: 2_350_000, marketingBudget: 310_000, integrations: ALL_INTEGRATION_IDS, goalBias: 104 },
  { id: "empresa-b", name: "Empresa B", segment: "SaaS B2B", initials: "B", color: "#14b8a6", icon: "cpu", revenueGoal: 1_460_000, marketingBudget: 190_000, integrations: ["crm", "ga4", "gsc", "meta", "facebook"], goalBias: 88 },
  { id: "empresa-c", name: "Empresa C", segment: "Educação", initials: "C", color: "#a3e635", icon: "graduation-cap", revenueGoal: 890_000, marketingBudget: 120_000, integrations: ["crm", "ga4", "meta", "instagram"], goalBias: 73 },
];

/** Back-compat alias for code and tests that need the seed list. */
export const BRANDS = DEFAULT_BRANDS;

export const BRAND_COLORS: { name: string; value: string }[] = [
  { name: "Verde", value: "#22c55e" },
  { name: "Esmeralda", value: "#10b981" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Lima", value: "#a3e635" },
  { name: "Ciano", value: "#06b6d4" },
  { name: "Azul", value: "#3b82f6" },
  { name: "Âmbar", value: "#f59e0b" },
  { name: "Coral", value: "#f97316" },
  { name: "Rosa", value: "#f43f5e" },
  { name: "Violeta", value: "#8b5cf6" },
];

export function brandScale(brand: Brand): number {
  return Math.max(0.02, brand.revenueGoal / REFERENCE_REVENUE_GOAL);
}

export function brandGoalBias(brand: Brand): number {
  if (brand.goalBias !== undefined) return brand.goalBias;
  let h = 0;
  for (const ch of brand.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return 74 + (h % 36); // 74–109
}

export function initialsFrom(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "empresa"
  );
}

export function uniqueBrandId(name: string, taken: string[]): string {
  const base = slugify(name);
  let id = base;
  let n = 2;
  while (taken.includes(id)) id = `${base}-${n++}`;
  return id;
}

/** Readable text color (dark or light) over a hex background. */
export function contrastText(hex: string): "dark" | "light" {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? "dark" : "light";
}

/** Validates a brand read back from browser storage. */
export function isBrand(v: unknown): v is Brand {
  if (!v || typeof v !== "object") return false;
  const b = v as Record<string, unknown>;
  return typeof b.id === "string" && typeof b.name === "string" && typeof b.revenueGoal === "number" && typeof b.marketingBudget === "number" && Array.isArray(b.integrations) && typeof b.color === "string";
}
