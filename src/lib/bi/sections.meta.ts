import {
  BriefcaseBusiness,
  Globe,
  Megaphone,
  Instagram,
  Facebook,
  CalendarDays,
  Newspaper,
  HeartHandshake,
  Handshake,
  type LucideIcon,
} from "lucide-react";

export type SectionMeta = { id: string; title: string; description: string; icon: LucideIcon };

/** The 9 pages every brand has, in sidebar order. */
export const SECTIONS: SectionMeta[] = [
  { id: "revops", title: "RevOps & Comercial", description: "Receita, pipeline e eficiência do time comercial", icon: BriefcaseBusiness },
  { id: "site-seo", title: "Site & SEO", description: "Tráfego do site, conversão e busca orgânica", icon: Globe },
  { id: "meta-ads", title: "Tráfego Pago (Meta Ads)", description: "Investimento, retorno e eficiência das campanhas", icon: Megaphone },
  { id: "instagram", title: "Mídia - Instagram", description: "Audiência, alcance e engajamento do perfil", icon: Instagram },
  { id: "facebook", title: "Mídia - Facebook", description: "Desempenho da página e das publicações", icon: Facebook },
  { id: "eventos", title: "Eventos", description: "Participação, leads e pipeline gerado por eventos", icon: CalendarDays },
  { id: "pr", title: "Relações Públicas (PR)", description: "Presença na mídia, sentimento e share of voice", icon: Newspaper },
  { id: "endomarketing", title: "Endomarketing", description: "Engajamento e clima dos colaboradores", icon: HeartHandshake },
  { id: "parcerias", title: "Marketing de Parcerias", description: "Receita e leads gerados por parceiros", icon: Handshake },
];

export function getSection(id: string): SectionMeta | undefined {
  return SECTIONS.find((s) => s.id === id);
}
