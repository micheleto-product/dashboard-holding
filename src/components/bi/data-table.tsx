import { Badge } from "@/components/ui/badge";
import { formatValue } from "@/lib/bi/format";
import type { Column, TableSpec } from "@/lib/bi/types";
import { cn } from "@/lib/utils";
import { Delta } from "./delta";

function Cell({ col, value }: { col: Column; value: string | number }) {
  if (col.format === "status") {
    const tone = col.tones?.[String(value)] ?? "neutral";
    return <Badge variant={tone}>{value}</Badge>;
  }
  if (col.format === "delta") return <Delta change={Number(value)} />;
  if (!col.format || col.format === "text") return <>{value}</>;
  return <>{formatValue(Number(value), col.format)}</>;
}

export function DataTable({ spec }: { spec: TableSpec }) {
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-y bg-muted/40">
            {spec.columns.map((col) => (
              <th key={col.key} className={cn("eyebrow px-5 py-2 font-medium", col.align === "right" ? "text-right" : "text-left")}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {spec.rows.map((row, i) => (
            <tr key={i} className="border-b transition-colors last:border-0 hover:bg-muted/40">
              {spec.columns.map((col, ci) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-5 py-2.5 whitespace-nowrap",
                    col.align === "right" ? "num text-right" : "text-left",
                    ci === 0 ? "font-medium" : "text-muted-foreground",
                    col.align === "right" && ci > 0 && "text-foreground/90",
                  )}
                >
                  <Cell col={col} value={row[col.key] ?? ""} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
