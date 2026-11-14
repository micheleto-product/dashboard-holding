import { BarChart3, Database, Facebook, Instagram, Megaphone, Search, Webhook, type LucideIcon } from "lucide-react";
import type { Brand } from "./brands";
import { seeded } from "./rng";
import type { Tone } from "./types";

export type IntegrationField = { key: string; label: string; placeholder: string; secret?: boolean };
export type IntegrationDef = { id: string; name: string; short: string; description: string; icon: LucideIcon; fields: IntegrationField[] };

export const INTEGRATIONS: IntegrationDef[] = [
  { id: "crm", name: "CRM", short: "CRM", description: "HubSpot, RD Station ou Salesforce — funil e receita", icon: Database, fields: [{ key: "provider", label: "Plataforma", placeholder: "HubSpot" }, { key: "token", label: "Token de API", placeholder: "pat-na1-••••", secret: true }] },
  { id: "ga4", name: "Google Analytics 4", short: "GA4", description: "Sessões, usuários e conversões do site", icon: BarChart3, fields: [{ key: "property", label: "ID da Propriedade", placeholder: "properties/123456789" }, { key: "key", label: "Chave da conta de serviço", placeholder: '{ "type": "service_account" … }', secret: true }] },
  { id: "gsc", name: "Google Search Console", short: "Search Console", description: "Impressões, cliques e posição orgânica", icon: Search, fields: [{ key: "site", label: "URL do site", placeholder: "sc-domain:empresa.com.br" }] },
  { id: "meta", name: "Meta Ads", short: "Meta Ads", description: "Campanhas, investimento e ROAS", icon: Megaphone, fields: [{ key: "account", label: "ID da Conta de Anúncios", placeholder: "act_1234567890" }, { key: "token", label: "Token de acesso", placeholder: "EAAB••••", secret: true }] },
  { id: "instagram", name: "Instagram Graph API", short: "Instagram", description: "Seguidores, alcance e engajamento", icon: Instagram, fields: [{ key: "account", label: "ID da conta Business", placeholder: "17841400000000000" }, { key: "token", label: "Token de acesso", placeholder: "IGQV••••", secret: true }] },
  { id: "facebook", name: "Facebook Pages", short: "Facebook", description: "Alcance e engajamento da página", icon: Facebook, fields: [{ key: "page", label: "ID da Página", placeholder: "1029384756" }, { key: "token", label: "Token da página", placeholder: "EAAB••••", secret: true }] },
  { id: "webhook", name: "Webhooks", short: "Webhooks", description: "Receba eventos de outras ferramentas (eventos, PR, RH)", icon: Webhook, fields: [{ key: "url", label: "URL de destino", placeholder: "https://…" }, { key: "secret", label: "Segredo de assinatura", placeholder: "whsec_••••", secret: true }] },
];

export function getIntegration(id: string) {
  return INTEGRATIONS.find((i) => i.id === id);
}

/** Which data sources feed each brand page. */
export const SECTION_SOURCES: Record<string, string[]> = {
  revops: ["crm"],
  "site-seo": ["ga4", "gsc"],
  "meta-ads": ["meta"],
  instagram: ["instagram"],
  facebook: ["facebook"],
  eventos: ["crm", "webhook"],
  pr: ["webhook", "ga4"],
  endomarketing: ["webhook"],
  parcerias: ["crm"],
};

export type IntegrationStatus = { label: string; tone: Tone; sync: string };

export const STATUS = {
  off: { label: "Desativada", tone: "neutral", sync: "—" },
  pending: { label: "Aguardando credenciais", tone: "warning", sync: "—" },
  connected: { label: "Conectado", tone: "success", sync: "agora" },
} satisfies Record<string, IntegrationStatus>;

const SAMPLE_STATUS: IntegrationStatus[] = [
  { label: "Conectado", tone: "success", sync: "há 4 min" },
  { label: "Conectado", tone: "success", sync: "há 12 min" },
  { label: "Conectado", tone: "success", sync: "há 1 h" },
  { label: "Token expirando", tone: "warning", sync: "há 3 h" },
  { label: "Erro de sincronização", tone: "danger", sync: "há 2 dias" },
];

/** Starting status shown for a brand's integration (sample data until real credentials are saved). */
export function initialStatus(brand: Brand, integrationId: string, isDefaultBrand: boolean): IntegrationStatus {
  if (!brand.integrations.includes(integrationId)) return STATUS.off;
  if (!isDefaultBrand) return STATUS.pending;
  const r = seeded(`int:${brand.id}:${integrationId}`).next();
  const idx = r < 0.7 ? Math.floor(r * 4.3) % 3 : r < 0.85 ? 3 : 4;
  return SAMPLE_STATUS[idx]!;
}

/** Human labels of the sources used by a page, e.g. "CRM Empresa A". */
export function sourceLabels(brand: Brand, sectionId: string): string[] {
  return (SECTION_SOURCES[sectionId] ?? []).map((id) => `${getIntegration(id)?.short ?? id} ${brand.name}`);
}
