/**
 * Holding brand registry. To add a new company, append an entry here —
 * the sidebar, holding summary, integrations drawer and all 9 brand pages pick it up.
 */
export type Brand = {
  id: string;
  name: string;
  segment: string;
  initials: string;
  /** Relative size of the business (1 = largest). Scales volume metrics. */
  scale: number;
  /** Typical goal attainment in % — drives the health badge in sample data. */
  goalBias: number;
};

export const BRANDS: Brand[] = [
  { id: "empresa-a", name: "Empresa A", segment: "Varejo & E-commerce", initials: "A", scale: 1, goalBias: 104 },
  { id: "empresa-b", name: "Empresa B", segment: "SaaS B2B", initials: "B", scale: 0.62, goalBias: 88 },
  { id: "empresa-c", name: "Empresa C", segment: "Educação", initials: "C", scale: 0.38, goalBias: 73 },
];

export function getBrand(id: string): Brand | undefined {
  return BRANDS.find((b) => b.id === id);
}
