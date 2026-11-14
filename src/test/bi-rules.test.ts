import { describe, expect, it } from "vitest";
import { BRANDS } from "@/lib/bi/brands";
import { SECTIONS } from "@/lib/bi/sections.meta";
import { getSectionData } from "@/lib/bi/sections.data";
import { PERIOD_OPTIONS } from "@/lib/bi/period";
import { healthFromGoal } from "@/lib/bi/holding";

describe("Holding BI rules", () => {
  it("every brand has the 9 pages in the brief's order", () => {
    expect(SECTIONS.map((s) => s.title)).toEqual([
      "RevOps & Comercial",
      "Site & SEO",
      "Tráfego Pago (Meta Ads)",
      "Mídia - Instagram",
      "Mídia - Facebook",
      "Eventos",
      "Relações Públicas (PR)",
      "Endomarketing",
      "Marketing de Parcerias",
    ]);
  });

  it("each brand page has 4–5 KPI cards, 2 charts and 1 table", () => {
    for (const brand of BRANDS) {
      for (const s of SECTIONS) {
        const d = getSectionData(brand, s.id, { key: "30d" });
        expect(d, `${brand.id}/${s.id}`).toBeDefined();
        expect(d!.kpis.length).toBeGreaterThanOrEqual(4);
        expect(d!.kpis.length).toBeLessThanOrEqual(5);
        expect(d!.charts).toHaveLength(2);
        expect(d!.table.rows.length).toBeGreaterThan(0);
      }
    }
  });

  it("period filter offers the brief's options", () => {
    expect(PERIOD_OPTIONS.map((o) => o.label)).toEqual([
      "Hoje",
      "Últimos 7 dias",
      "Últimos 30 dias",
      "Este Trimestre",
      "Este Ano",
      "Personalizado",
    ]);
  });

  it("health badge is green / yellow / red", () => {
    expect(healthFromGoal(100).tone).toBe("success");
    expect(healthFromGoal(85).tone).toBe("warning");
    expect(healthFromGoal(70).tone).toBe("danger");
  });
});
