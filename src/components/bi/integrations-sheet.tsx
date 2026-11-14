import { useState, type ReactNode } from "react";
import { BarChart3, ChevronDown, Database, Eye, EyeOff, Facebook, Instagram, Megaphone, Search, Webhook, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BRANDS } from "@/lib/bi/brands";
import { seeded } from "@/lib/bi/rng";
import type { Tone } from "@/lib/bi/types";
import { cn } from "@/lib/utils";
import { useAppState } from "./app-state";

type Field = { key: string; label: string; placeholder: string; secret?: boolean };
type IntegrationDef = { id: string; name: string; description: string; icon: LucideIcon; fields: Field[] };

const INTEGRATIONS: IntegrationDef[] = [
  { id: "crm", name: "CRM", description: "HubSpot, RD Station ou Salesforce — funil e receita", icon: Database, fields: [{ key: "provider", label: "Plataforma", placeholder: "HubSpot" }, { key: "token", label: "Token de API", placeholder: "pat-na1-••••", secret: true }] },
  { id: "ga4", name: "Google Analytics 4", description: "Sessões, usuários e conversões do site", icon: BarChart3, fields: [{ key: "property", label: "ID da Propriedade", placeholder: "properties/123456789" }, { key: "key", label: "Chave da conta de serviço", placeholder: "{ \"type\": \"service_account\" … }", secret: true }] },
  { id: "gsc", name: "Google Search Console", description: "Impressões, cliques e posição orgânica", icon: Search, fields: [{ key: "site", label: "URL do site", placeholder: "sc-domain:empresa.com.br" }] },
  { id: "meta", name: "Meta Ads", description: "Campanhas, investimento e ROAS", icon: Megaphone, fields: [{ key: "account", label: "ID da Conta de Anúncios", placeholder: "act_1234567890" }, { key: "token", label: "Token de acesso", placeholder: "EAAB••••", secret: true }] },
  { id: "instagram", name: "Instagram Graph API", description: "Seguidores, alcance e engajamento", icon: Instagram, fields: [{ key: "account", label: "ID da conta Business", placeholder: "17841400000000000" }, { key: "token", label: "Token de acesso", placeholder: "IGQV••••", secret: true }] },
  { id: "facebook", name: "Facebook Pages", description: "Alcance e engajamento da página", icon: Facebook, fields: [{ key: "page", label: "ID da Página", placeholder: "1029384756" }, { key: "token", label: "Token da página", placeholder: "EAAB••••", secret: true }] },
  { id: "webhook", name: "Webhooks", description: "Receba eventos de outras ferramentas", icon: Webhook, fields: [{ key: "url", label: "URL de destino", placeholder: "https://…" }, { key: "secret", label: "Segredo de assinatura", placeholder: "whsec_••••", secret: true }] },
];

type Status = { label: string; tone: Tone; sync: string };
const STATUS_OPTIONS: Status[] = [
  { label: "Conectado", tone: "success", sync: "há 4 min" },
  { label: "Conectado", tone: "success", sync: "há 12 min" },
  { label: "Conectado", tone: "success", sync: "há 1 h" },
  { label: "Token expirando", tone: "warning", sync: "há 3 h" },
  { label: "Erro de sincronização", tone: "danger", sync: "há 2 dias" },
  { label: "Não conectado", tone: "neutral", sync: "—" },
];

function initialStatus(brandId: string, integrationId: string): Status {
  const r = seeded(`int:${brandId}:${integrationId}`).next();
  const idx = r < 0.55 ? Math.floor(r * 5.4) % 3 : r < 0.7 ? 3 : r < 0.82 ? 4 : 5;
  return STATUS_OPTIONS[idx];
}

function SecretInput({ id, placeholder, value, onChange }: { id: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input id={id} type={show ? "text" : "password"} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="pr-9 font-mono text-xs" autoComplete="off" />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground" aria-label={show ? "Ocultar" : "Mostrar"}>
        {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
    </div>
  );
}

function IntegrationRow({ brandId, def, status, onStatus }: { brandId: string; def: IntegrationDef; status: Status; onStatus: (s: Status) => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const filled = def.fields.every((f) => (values[f.key] ?? "").trim().length > 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border bg-card">
      <CollapsibleTrigger className="flex w-full items-center gap-3 p-3 text-left">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <def.icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{def.name}</span>
            <Badge variant={status.tone}>{status.label}</Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">{def.description}</p>
        </div>
        <span className="hidden text-[11px] text-muted-foreground sm:inline">Sinc. {status.sync}</span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-3 border-t p-3">
          {def.fields.map((f) => {
            const id = `${brandId}-${def.id}-${f.key}`;
            return (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={id} className="text-xs">
                  {f.label}
                </Label>
                {f.secret ? (
                  <SecretInput id={id} placeholder={f.placeholder} value={values[f.key] ?? ""} onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))} />
                ) : (
                  <Input id={id} placeholder={f.placeholder} value={values[f.key] ?? ""} onChange={(e) => setValues((s) => ({ ...s, [f.key]: e.target.value }))} className="text-xs" />
                )}
              </div>
            );
          })}
          <div className="flex items-center justify-between gap-2 pt-1">
            {status.tone !== "neutral" ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  onStatus(STATUS_OPTIONS[5]);
                  toast(`${def.name} desconectado`);
                }}
              >
                Desconectar
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={!filled} onClick={() => toast.success(`Conexão com ${def.name} respondeu corretamente`)}>
                Testar conexão
              </Button>
              <Button
                size="sm"
                disabled={!filled}
                onClick={() => {
                  onStatus({ label: "Conectado", tone: "success", sync: "agora" });
                  setOpen(false);
                  toast.success(`${def.name} salvo`, { description: "Válido apenas nesta sessão do navegador." });
                }}
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function IntegrationsSheet({ trigger }: { trigger: ReactNode }) {
  const { brandId } = useAppState();
  const [tab, setTab] = useState(brandId);
  const [overrides, setOverrides] = useState<Record<string, Status>>({});

  return (
    <Sheet onOpenChange={(o) => o && setTab(brandId)}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Configurações de API & Integrações</SheetTitle>
          <SheetDescription>Gerencie as chaves, webhooks e o status das fontes de dados de cada empresa.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              {BRANDS.map((b) => (
                <TabsTrigger key={b.id} value={b.id} className="flex-1">
                  {b.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="space-y-2">
            {INTEGRATIONS.map((def) => {
              const k = `${tab}:${def.id}`;
              return (
                <IntegrationRow key={k} brandId={tab} def={def} status={overrides[k] ?? initialStatus(tab, def.id)} onStatus={(s) => setOverrides((o) => ({ ...o, [k]: s }))} />
              );
            })}
          </div>
          <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
            Os painéis exibem dados de exemplo até que as integrações estejam conectadas a uma fonte real.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
