import { Link, useRouterState } from "@tanstack/react-router";
import { Moon, PlugZap, Sun } from "lucide-react";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { getBrand } from "@/lib/bi/brands";
import { getSection } from "@/lib/bi/sections.meta";
import { PeriodFilter } from "./period-filter";
import { IntegrationsSheet } from "./integrations-sheet";
import { useAppState } from "./app-state";

function useCrumbs(): { label: string; to?: "/" }[] {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/") return [{ label: "Holding" }, { label: "Resumo Executivo" }];
  if (pathname === "/assistente") return [{ label: "Holding", to: "/" }, { label: "Assistente IA Executivo" }];
  const m = pathname.match(/^\/marca\/([^/]+)\/([^/]+)/);
  if (m) {
    return [{ label: "Holding", to: "/" }, { label: getBrand(m[1])?.name ?? "Marca" }, { label: getSection(m[2])?.title ?? "" }];
  }
  return [{ label: "Holding", to: "/" }];
}

export function AppHeader() {
  const crumbs = useCrumbs();
  const { theme, toggleTheme } = useAppState();
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-5" />
      <nav aria-label="Navegação" className="flex min-w-0 items-center gap-1.5 text-sm">
        {crumbs.map((c, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="text-muted-foreground/50">/</span>}
            {c.to ? (
              <Link to={c.to} className="truncate text-muted-foreground transition-colors hover:text-foreground">
                {c.label}
              </Link>
            ) : (
              <span className={i === crumbs.length - 1 ? "truncate font-medium" : "truncate text-muted-foreground"}>{c.label}</span>
            )}
          </Fragment>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <PeriodFilter />
        <IntegrationsSheet
          trigger={
            <Button variant="outline" size="sm" className="bg-card">
              <PlugZap className="text-primary" />
              <span className="hidden lg:inline">Configurações de API & Integrações</span>
              <span className="lg:hidden">Integrações</span>
            </Button>
          }
        />
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={theme === "dark" ? "Usar tema claro" : "Usar tema escuro"}>
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>
      </div>
    </header>
  );
}
