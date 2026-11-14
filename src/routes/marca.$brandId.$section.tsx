import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useAppState } from "@/components/bi/app-state";
import { KpiGrid } from "@/components/bi/kpi-card";
import { PageHeader, Panel } from "@/components/bi/panel";
import { ChartRenderer } from "@/components/bi/chart-renderer";
import { DataTable } from "@/components/bi/data-table";
import { BrandMark } from "@/components/bi/app-sidebar";
import { getBrand } from "@/lib/bi/brands";
import { getSection } from "@/lib/bi/sections.meta";
import { getSectionData } from "@/lib/bi/sections.data";
import { periodLabel } from "@/lib/bi/period";

export const Route = createFileRoute("/marca/$brandId/$section")({
  loader: ({ params }) => {
    const brand = getBrand(params.brandId);
    const section = getSection(params.section);
    if (!brand || !section) throw notFound();
    return { brandName: brand.name, sectionTitle: section.title, sectionDescription: section.description };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.sectionTitle} · ${loaderData.brandName}` : "Página indisponível";
    const description = loaderData ? `${loaderData.sectionDescription} — ${loaderData.brandName}.` : "Esta página não existe.";
    return {
      meta: [
        { title: `${title} · Holding Growth Intelligence` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  component: BrandSectionPage,
});

function BrandSectionPage() {
  const { brandId, section: sectionId } = Route.useParams();
  const { period, setBrandId } = useAppState();
  const brand = getBrand(brandId)!;
  const section = getSection(sectionId)!;

  useEffect(() => {
    setBrandId(brandId);
  }, [brandId, setBrandId]);

  const data = useMemo(() => getSectionData(brand, sectionId, period), [brand, sectionId, period]);
  if (!data) return null;

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 p-4 md:p-6" key={`${brandId}-${sectionId}`}>
      <PageHeader
        eyebrow={`${brand.name} · ${periodLabel(period)}`}
        title={section.title}
        description={section.description}
        actions={
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5">
            <BrandMark initials={brand.initials} className="size-6 text-[10px]" />
            <span className="text-xs text-muted-foreground">{brand.segment}</span>
          </div>
        }
      />
      <KpiGrid kpis={data.kpis} />
      <div className="grid gap-4 xl:grid-cols-2">
        {data.charts.map((chart) => (
          <Panel key={chart.title} title={chart.title} subtitle={chart.subtitle}>
            <ChartRenderer spec={chart} />
          </Panel>
        ))}
      </div>
      <Panel title={data.table.title} subtitle={data.table.subtitle}>
        <DataTable spec={data.table} />
      </Panel>
    </div>
  );
}
