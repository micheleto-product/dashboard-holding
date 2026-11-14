import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Check, ChevronsUpDown, LayoutDashboard, Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BRANDS, getBrand } from "@/lib/bi/brands";
import { SECTIONS } from "@/lib/bi/sections.meta";
import { useAppState } from "./app-state";
import { cn } from "@/lib/utils";

export function BrandMark({ initials, className }: { initials: string; className?: string }) {
  return (
    <span className={cn("bg-brand-gradient flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-primary-foreground", className)}>
      {initials}
    </span>
  );
}

function useCurrentBrandSection() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const m = pathname.match(/^\/marca\/([^/]+)\/([^/]+)/);
  return { pathname, brandId: m?.[1], sectionId: m?.[2] };
}

function BrandSwitcher() {
  const { brandId, setBrandId } = useAppState();
  const { sectionId } = useCurrentBrandSection();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const brand = getBrand(brandId) ?? BRANDS[0];

  const select = (id: string) => {
    setBrandId(id);
    navigate({ to: "/marca/$brandId/$section", params: { brandId: id, section: sectionId ?? "revops" } });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg" className="border bg-sidebar-accent/40 data-[state=open]:bg-sidebar-accent" tooltip={brand.name}>
          <BrandMark initials={brand.initials} />
          {state === "expanded" && (
            <>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">{brand.name}</span>
                <span className="truncate text-[11px] text-muted-foreground">{brand.segment}</span>
              </div>
              <ChevronsUpDown className="size-4 text-muted-foreground" />
            </>
          )}
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel className="eyebrow">Empresas da holding</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {BRANDS.map((b) => (
          <DropdownMenuItem key={b.id} onSelect={() => select(b.id)} className="gap-2.5">
            <BrandMark initials={b.initials} className="size-6 text-[10px]" />
            <div className="grid flex-1 leading-tight">
              <span className="text-sm">{b.name}</span>
              <span className="text-[11px] text-muted-foreground">{b.segment}</span>
            </div>
            {b.id === brand.id && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppSidebar() {
  const { brandId } = useAppState();
  const { pathname, brandId: routeBrand, sectionId } = useCurrentBrandSection();
  const brand = getBrand(routeBrand ?? brandId) ?? BRANDS[0];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 p-3">
        <div className="flex items-center gap-2 px-1 pt-1">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-card">
            <span className="bg-brand-gradient size-3 rotate-45 rounded-[3px]" />
          </span>
          <div className="grid leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight">Holding</span>
            <span className="text-[11px] text-muted-foreground">Growth Intelligence</span>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <BrandSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Visão Corporativa</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"} tooltip="Resumo Executivo">
                  <Link to="/">
                    <LayoutDashboard />
                    <span>Resumo Executivo</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/assistente"} tooltip="Assistente IA Executivo">
                  <Link to="/assistente">
                    <Sparkles />
                    <span>Assistente IA Executivo</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{brand.name}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SECTIONS.map((s) => (
                <SidebarMenuItem key={s.id}>
                  <SidebarMenuButton asChild isActive={routeBrand === brand.id && sectionId === s.id} tooltip={s.title}>
                    <Link to="/marca/$brandId/$section" params={{ brandId: brand.id, section: s.id }}>
                      <s.icon />
                      <span>{s.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-2.5 rounded-md px-1 py-1">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">DX</span>
          <div className="grid leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-medium">Diretoria Executiva</span>
            <span className="text-[11px] text-muted-foreground">Acesso C-Level</span>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
