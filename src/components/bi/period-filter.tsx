import { useState } from "react";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import type { DateRange as DayRange } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PERIOD_OPTIONS, periodLabel } from "@/lib/bi/period";
import { cn } from "@/lib/utils";
import { useAppState } from "./app-state";

export function PeriodFilter() {
  const { period, setPeriod } = useAppState();
  const [open, setOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(period.key === "custom");
  const [draft, setDraft] = useState<DayRange | undefined>(period.range);

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setShowCalendar(period.key === "custom");
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-card font-normal">
          <CalendarDays className="text-muted-foreground" />
          <span className="num">{periodLabel(period)}</span>
          <ChevronDown className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <div className="flex">
          <ul className="w-48 border-r p-1.5">
            {PERIOD_OPTIONS.map((o) => {
              const active = period.key === o.key;
              return (
                <li key={o.key}>
                  <button
                    type="button"
                    onClick={() => {
                      if (o.key === "custom") {
                        setShowCalendar(true);
                        return;
                      }
                      setPeriod({ key: o.key });
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      (active || (o.key === "custom" && showCalendar)) && "bg-accent text-accent-foreground",
                    )}
                  >
                    {o.label}
                    {active && <Check className="size-3.5 text-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>
          {showCalendar && (
            <div className="flex flex-col">
              <Calendar mode="range" locale={ptBR} selected={draft} onSelect={setDraft} numberOfMonths={1} disabled={{ after: new Date() }} />
              <div className="flex justify-end gap-2 border-t p-2">
                <Button variant="ghost" size="sm" onClick={() => setShowCalendar(false)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  disabled={!draft?.from || !draft?.to}
                  onClick={() => {
                    if (draft?.from && draft?.to) {
                      setPeriod({ key: "custom", range: { from: draft.from, to: draft.to } });
                      setOpen(false);
                    }
                  }}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
