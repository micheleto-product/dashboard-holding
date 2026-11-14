import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatDelta } from "@/lib/bi/format";
import { cn } from "@/lib/utils";

/** Change vs. previous period; green when the movement is good for the business. */
export function Delta({ change, invert, className }: { change: number; invert?: boolean | undefined; className?: string | undefined }) {
  const good = invert ? change <= 0 : change >= 0;
  const Icon = change >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "num inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
        good ? "bg-success-soft text-success" : "bg-danger-soft text-destructive",
        className,
      )}
    >
      <Icon className="size-3" strokeWidth={2.5} />
      {formatDelta(change)}
    </span>
  );
}
