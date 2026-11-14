import type { Brand } from "./brands";
import { periodBuckets, periodFactor, periodSeed, type PeriodState } from "./period";
import { seeded, type Rng } from "./rng";
import type { ValueFormat } from "./format";
import type { Kpi, SectionData } from "./types";
import { getBrandSummary } from "./holding";

type Ctx = {
  rng: Rng;
  /** volume multiplier = brand scale × period length */
  vol: number;
  buckets: string[];
  brand: Brand;
  period: PeriodState;
};

function makeCtx(brand: Brand, sectionId: string, period: PeriodState): Ctx {
  return {
    rng: seeded(`${brand.id}:${sectionId}:${periodSeed(period)}`),
    vol: brand.scale * periodFactor(period),
    buckets: periodBuckets(period),
    brand,
    period,
  };
}

/** Time series that sums (roughly) to `total`, with a gentle trend. */
function trendSeries(ctx: Ctx, total: number, trend = 0.25, noise = 0.18): number[] {
  const n = ctx.buckets.length;
  const raw = ctx.buckets.map((_, i) => (1 + trend * (i / Math.max(1, n - 1) - 0.5)) * ctx.rng.vary(1, noise));
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((r) => (r / sum) * total);
}

/** Series around a level (for rates/ratios — not summed). */
function levelSeries(ctx: Ctx, level: number, trend = 0.08, noise = 0.06): number[] {
  const n = ctx.buckets.length;
  return ctx.buckets.map((_, i) => level * (1 + trend * (i / Math.max(1, n - 1) - 0.5)) * ctx.rng.vary(1, noise));
}

function kpi(ctx: Ctx, label: string, value: number, format: ValueFormat, opts: { invert?: boolean | undefined; spark?: number[] | undefined; bias?: number | undefined } = {}): Kpi {
  const bias = opts.bias ?? (ctx.brand.goalBias - 90) / 4;
  const change = ctx.rng.range(-9, 16) + bias * (opts.invert ? -1 : 1);
  return {
    label,
    value,
    format,
    change: Math.round(change * 10) / 10,
    invert: opts.invert,
    spark: opts.spark ?? levelSeries(ctx, value, opts.invert ? -0.2 : 0.2, 0.12),
  };
}

function zip(ctx: Ctx, series: Record<string, number[]>) {
  return ctx.buckets.map((label, i) => {
    const row: Record<string, number | string> = { label };
    for (const [k, arr] of Object.entries(series)) row[k] = Math.round((arr[i] ?? 0) * 100) / 100;
    return row;
  });
}

const r0 = (n: number) => Math.round(n);
const r1 = (n: number) => Math.round(n * 10) / 10;

/* ------------------------------------------------------------------ */

function revops(ctx: Ctx): SectionData {
  const { rng, vol } = ctx;
  const summary = getBrandSummary(ctx.brand, ctx.period);
  const leads = Math.max(summary.leads, 1);
  const mql = summary.qualifiedLeads;
  const sql = r0(mql * rng.range(0.42, 0.52));
  const prop = r0(sql * rng.range(0.45, 0.55));
  const won = Math.max(1, r0(prop * rng.range(0.3, 0.4) * (ctx.brand.goalBias / 100)));
  const revenue = summary.revenue;
  const ticket = revenue / won;
  const goal = revenue / (summary.goalPct / 100);
  const pipeline = prop * ticket * rng.range(1.6, 2.1);
  const conv = (won / leads) * 100;
  const cycle = rng.vary(38, 0.15);
  const revSeries = summary.revenueSeries;
  const goalSeries = trendSeries(ctx, goal, 0.1, 0.02);
  const reps = ["Ana Ribeiro", "Bruno Costa", "Carla Mendes", "Diego Alves", "Elisa Prado", "Felipe Nunes"];
  return {
    kpis: [
      { ...kpi(ctx, "Receita Nova", revenue, "currency", { spark: summary.revenueSeries }), change: summary.change.revenue },
      kpi(ctx, "Pipeline Ativo", pipeline, "currency"),
      kpi(ctx, "Taxa de Conversão Geral", conv, "percent"),
      kpi(ctx, "Ticket Médio", ticket, "currency"),
      kpi(ctx, "Ciclo Médio de Vendas", cycle, "days", { invert: true }),
    ],
    charts: [
      {
        kind: "funnel",
        title: "Funil de Vendas",
        subtitle: "Lead → MQL → SQL → Proposta → Fechamento",
        format: "number",
        data: [
          { name: "Leads", value: leads },
          { name: "MQL", value: mql },
          { name: "SQL", value: sql },
          { name: "Proposta", value: prop },
          { name: "Fechamento", value: won },
        ],
      },
      {
        kind: "composed",
        title: "Receita vs. Meta",
        subtitle: "Receita fechada no período comparada à meta",
        format: "currency",
        data: zip(ctx, { receita: revSeries, meta: goalSeries }),
        series: [
          { key: "receita", label: "Receita", color: 1, type: "bar" },
          { key: "meta", label: "Meta", color: 3, type: "line" },
        ],
      },
    ],
    table: {
      title: "Desempenho por Vendedor",
      subtitle: "Ranking do time comercial no período",
      columns: [
        { key: "vendedor", label: "Vendedor", format: "text" },
        { key: "negocios", label: "Negócios", format: "number", align: "right" },
        { key: "receita", label: "Receita", format: "currency", align: "right" },
        { key: "conversao", label: "Conversão", format: "percent", align: "right" },
        { key: "ticket", label: "Ticket Médio", format: "currency", align: "right" },
        { key: "meta", label: "Meta Atingida", format: "percent", align: "right" },
      ],
      rows: reps
        .map((name) => {
          const n = Math.max(1, r0((won / reps.length) * rng.range(0.5, 1.5)));
          const t = ticket * rng.vary(1, 0.2);
          return { vendedor: name, negocios: n, receita: n * t, conversao: r1(conv * rng.vary(1, 0.3)), ticket: t, meta: r1(ctx.brand.goalBias * rng.vary(1, 0.2)) };
        })
        .sort((a, b) => b.receita - a.receita),
    },
  };
}

function siteSeo(ctx: Ctx): SectionData {
  const { rng, vol } = ctx;
  const sessions = rng.vary(185000, 0.08) * vol;
  const users = sessions * rng.range(0.62, 0.72);
  const conv = rng.range(1.8, 3.2);
  const organic = sessions * rng.range(0.38, 0.46);
  const position = rng.range(8, 16);
  const share = { organico: 0.42, direto: 0.22, pago: 0.2, social: 0.1, referencia: 0.06 };
  const channel = Object.fromEntries(Object.entries(share).map(([k, s]) => [k, trendSeries(ctx, sessions * s, 0.3)]));
  const impressions = trendSeries(ctx, organic * rng.range(18, 26), 0.25);
  const clicks = impressions.map((v) => v * rng.range(0.035, 0.055));
  const keywords = ["comprar online", "melhor preço", "frete grátis", "loja oficial", "avaliações", "promoção", "lançamento 2026", "atendimento", "como funciona", "planos e preços"];
  return {
    kpis: [
      kpi(ctx, "Sessões", sessions, "number", { spark: channel["organico"] ?? [] }),
      kpi(ctx, "Usuários Únicos", users, "number"),
      kpi(ctx, "Taxa de Conversão do Site", conv, "percent"),
      kpi(ctx, "Cliques Orgânicos", organic, "number", { spark: clicks }),
      kpi(ctx, "Posição Média (Google)", position, "position", { invert: true }),
    ],
    charts: [
      {
        kind: "area",
        title: "Sessões por Canal",
        subtitle: "Origem do tráfego do site (GA4)",
        format: "number",
        stacked: true,
        data: zip(ctx, channel),
        series: [
          { key: "organico", label: "Orgânico", color: 1 },
          { key: "direto", label: "Direto", color: 2 },
          { key: "pago", label: "Pago", color: 3 },
          { key: "social", label: "Social", color: 4 },
          { key: "referencia", label: "Referência", color: 5 },
        ],
      },
      {
        kind: "line",
        title: "Impressões vs. Cliques",
        subtitle: "Busca orgânica (Search Console)",
        format: "number",
        rightFormat: "number",
        data: zip(ctx, { impressoes: impressions, cliques: clicks }),
        series: [
          { key: "impressoes", label: "Impressões", color: 2 },
          { key: "cliques", label: "Cliques", color: 1 },
        ],
      },
    ],
    table: {
      title: "Principais Palavras-chave",
      subtitle: "Termos com mais cliques orgânicos",
      columns: [
        { key: "termo", label: "Palavra-chave", format: "text" },
        { key: "posicao", label: "Posição", format: "position", align: "right" },
        { key: "impressoes", label: "Impressões", format: "number", align: "right" },
        { key: "cliques", label: "Cliques", format: "number", align: "right" },
        { key: "ctr", label: "CTR", format: "percent", align: "right" },
        { key: "variacao", label: "Variação", format: "delta", align: "right" },
      ],
      rows: keywords
        .map((k, i) => {
          const imp = r0((organic * 20) / (i + 2) / 3 * rng.vary(1, 0.3));
          const ctr = rng.range(2, 9);
          return { termo: `${ctx.brand.name.toLowerCase()} ${k}`, posicao: r1(rng.range(1, 14)), impressoes: imp, cliques: r0((imp * ctr) / 100), ctr: r1(ctr), variacao: r1(rng.range(-12, 28)) };
        })
        .sort((a, b) => b.cliques - a.cliques),
    },
  };
}

function metaAds(ctx: Ctx): SectionData {
  const { rng, vol } = ctx;
  const spend = rng.vary(92000, 0.08) * vol;
  const roas = rng.range(2.6, 4.4) * (ctx.brand.goalBias / 95);
  const cpa = rng.range(38, 72);
  const ctr = rng.range(0.9, 1.9);
  const cpm = rng.range(14, 26);
  const spendSeries = trendSeries(ctx, spend, 0.2);
  const revSeries = spendSeries.map((s) => s * roas * rng.vary(1, 0.15));
  const objectives = ["Conversão", "Leads", "Remarketing", "Tráfego", "Alcance"];
  const weights = [0.38, 0.24, 0.18, 0.12, 0.08];
  const campaigns = ["[CONV] Black Friday — Lookalike 3%", "[LEADS] Formulário Nativo — Interesses", "[RMKT] Carrinho Abandonado 7d", "[CONV] Catálogo Advantage+", "[TRAF] Blog — Conteúdo Topo", "[ALC] Branding — Vídeo 15s", "[LEADS] Webinar Novembro"];
  return {
    kpis: [
      kpi(ctx, "Investimento", spend, "currency", { spark: spendSeries }),
      kpi(ctx, "ROAS", roas, "multiplier", { spark: revSeries }),
      kpi(ctx, "CPA", cpa, "currency", { invert: true }),
      kpi(ctx, "CTR", ctr, "percent"),
      kpi(ctx, "CPM", cpm, "currency", { invert: true }),
    ],
    charts: [
      {
        kind: "composed",
        title: "Investimento vs. Receita Atribuída",
        subtitle: "Retorno das campanhas ao longo do período",
        format: "currency",
        data: zip(ctx, { investimento: spendSeries, receita: revSeries }),
        series: [
          { key: "investimento", label: "Investimento", color: 4, type: "bar" },
          { key: "receita", label: "Receita atribuída", color: 1, type: "line" },
        ],
      },
      {
        kind: "donut",
        title: "Investimento por Objetivo",
        subtitle: "Distribuição da verba de mídia",
        format: "currency",
        data: objectives.map((name, i) => ({ name, value: spend * (weights[i] ?? 0) })),
      },
    ],
    table: {
      title: "Campanhas",
      subtitle: "Desempenho por campanha no Meta Ads",
      columns: [
        { key: "campanha", label: "Campanha", format: "text" },
        { key: "status", label: "Status", format: "status", tones: { Ativa: "success", Aprendizado: "warning", Pausada: "neutral" } },
        { key: "investimento", label: "Investimento", format: "currency", align: "right" },
        { key: "impressoes", label: "Impressões", format: "number", align: "right" },
        { key: "ctr", label: "CTR", format: "percent", align: "right" },
        { key: "cpa", label: "CPA", format: "currency", align: "right" },
        { key: "roas", label: "ROAS", format: "multiplier", align: "right" },
      ],
      rows: campaigns
        .map((c) => {
          const inv = (spend / campaigns.length) * rng.range(0.4, 1.7);
          return { campanha: c, status: rng.pick(["Ativa", "Ativa", "Ativa", "Aprendizado", "Pausada"]), investimento: inv, impressoes: r0((inv / cpm) * 1000), ctr: r1(ctr * rng.vary(1, 0.35)), cpa: cpa * rng.vary(1, 0.3), roas: roas * rng.vary(1, 0.35) };
        })
        .sort((a, b) => b.investimento - a.investimento),
    },
  };
}

function instagram(ctx: Ctx): SectionData {
  const { rng, vol, brand } = ctx;
  const followers = rng.vary(248000, 0.05) * brand.scale;
  const newFollowers = rng.vary(6400, 0.15) * vol;
  const reach = rng.vary(1_150_000, 0.1) * vol;
  const eng = rng.range(2.4, 4.8);
  const visits = reach * rng.range(0.05, 0.08);
  const growth = trendSeries(ctx, newFollowers, 0.3);
  let acc = followers - newFollowers;
  const cumulative = growth.map((g) => (acc += g));
  const formats = ["Reels", "Carrossel", "Imagem", "Stories"];
  const posts = ["Bastidores da nova coleção", "Tutorial em 30 segundos", "Depoimento de cliente", "Lançamento oficial", "Dicas da semana", "Collab com criador", "Enquete: qual favorito?"];
  return {
    kpis: [
      kpi(ctx, "Seguidores", followers, "number", { spark: cumulative }),
      kpi(ctx, "Novos Seguidores", newFollowers, "number", { spark: growth }),
      kpi(ctx, "Alcance", reach, "number"),
      kpi(ctx, "Taxa de Engajamento", eng, "percent"),
      kpi(ctx, "Visitas ao Perfil", visits, "number"),
    ],
    charts: [
      {
        kind: "area",
        title: "Crescimento de Seguidores",
        subtitle: "Base total acumulada no período",
        format: "number",
        data: zip(ctx, { seguidores: cumulative }),
        series: [{ key: "seguidores", label: "Seguidores", color: 1 }],
      },
      {
        kind: "vbar",
        title: "Engajamento por Formato",
        subtitle: "Taxa média de engajamento por tipo de conteúdo",
        format: "percent",
        valueLabel: "Engajamento",
        data: formats.map((name, i) => ({ name, value: r1(eng * ([1.45, 1.2, 0.7, 0.55][i] ?? 1) * rng.vary(1, 0.1)) })),
      },
    ],
    table: {
      title: "Publicações com Melhor Desempenho",
      columns: [
        { key: "post", label: "Publicação", format: "text" },
        { key: "formato", label: "Formato", format: "status", tones: { Reels: "success", Carrossel: "neutral", Imagem: "neutral", Stories: "neutral" } },
        { key: "alcance", label: "Alcance", format: "number", align: "right" },
        { key: "curtidas", label: "Curtidas", format: "number", align: "right" },
        { key: "comentarios", label: "Comentários", format: "number", align: "right" },
        { key: "salvamentos", label: "Salvamentos", format: "number", align: "right" },
        { key: "engajamento", label: "Engajamento", format: "percent", align: "right" },
      ],
      rows: posts
        .map((p) => {
          const a = r0((reach / 12) * rng.range(0.4, 1.6));
          const l = r0(a * rng.range(0.02, 0.06));
          return { post: p, formato: rng.pick(formats), alcance: a, curtidas: l, comentarios: r0(l * rng.range(0.03, 0.08)), salvamentos: r0(l * rng.range(0.05, 0.2)), engajamento: r1(eng * rng.vary(1, 0.4)) };
        })
        .sort((a, b) => b.alcance - a.alcance),
    },
  };
}

function facebook(ctx: Ctx): SectionData {
  const { rng, vol, brand } = ctx;
  const followers = rng.vary(132000, 0.05) * brand.scale;
  const organic = rng.vary(310000, 0.1) * vol;
  const paid = organic * rng.range(1.4, 2.2);
  const engagements = organic * rng.range(0.035, 0.06);
  const rate = (engagements / organic) * 100;
  const videoViews = organic * rng.range(0.4, 0.7);
  const ages = ["18–24", "25–34", "35–44", "45–54", "55–64", "65+"];
  const posts = ["Live: perguntas e respostas", "Álbum do evento", "Promoção relâmpago", "Vídeo institucional", "Artigo do blog", "Vaga aberta no time"];
  return {
    kpis: [
      kpi(ctx, "Seguidores da Página", followers, "number"),
      kpi(ctx, "Alcance Orgânico", organic, "number"),
      kpi(ctx, "Engajamentos", engagements, "number"),
      kpi(ctx, "Taxa de Engajamento", rate, "percent"),
      kpi(ctx, "Visualizações de Vídeo", videoViews, "number"),
    ],
    charts: [
      {
        kind: "area",
        title: "Alcance Orgânico vs. Pago",
        subtitle: "Pessoas alcançadas por origem",
        format: "number",
        stacked: true,
        data: zip(ctx, { organico: trendSeries(ctx, organic, 0.1), pago: trendSeries(ctx, paid, 0.3) }),
        series: [
          { key: "organico", label: "Orgânico", color: 1 },
          { key: "pago", label: "Pago", color: 2 },
        ],
      },
      {
        kind: "hbar",
        title: "Público por Faixa Etária",
        subtitle: "Distribuição dos seguidores da página",
        format: "percent",
        valueLabel: "Participação",
        data: ages.map((name, i) => ({ name, value: r1(([14, 31, 24, 16, 9, 6][i] ?? 1) * rng.vary(1, 0.1)) })),
      },
    ],
    table: {
      title: "Publicações Recentes",
      columns: [
        { key: "post", label: "Publicação", format: "text" },
        { key: "tipo", label: "Tipo", format: "status", tones: { Vídeo: "success", Foto: "neutral", Link: "neutral", Live: "warning" } },
        { key: "alcance", label: "Alcance", format: "number", align: "right" },
        { key: "reacoes", label: "Reações", format: "number", align: "right" },
        { key: "compart", label: "Compart.", format: "number", align: "right" },
        { key: "cliques", label: "Cliques", format: "number", align: "right" },
        { key: "engajamento", label: "Engajamento", format: "percent", align: "right" },
      ],
      rows: posts.map((p) => {
        const a = r0((organic / 10) * rng.range(0.4, 1.6));
        return { post: p, tipo: rng.pick(["Vídeo", "Foto", "Link", "Live"]), alcance: a, reacoes: r0(a * rng.range(0.015, 0.04)), compart: r0(a * rng.range(0.002, 0.008)), cliques: r0(a * rng.range(0.01, 0.03)), engajamento: r1(rate * rng.vary(1, 0.35)) };
      }),
    },
  };
}

function eventos(ctx: Ctx): SectionData {
  const { rng, vol } = ctx;
  const count = Math.max(1, r0(rng.vary(6, 0.2) * vol));
  const names = ["Summit Anual", "Webinar: Tendências 2027", "Workshop Prático", "Feira do Setor", "Meetup Clientes", "Café com Parceiros", "Masterclass Executiva", "Roadshow Regional"];
  const types = ["Webinar", "Feira", "Workshop", "Meetup"];
  const list = names.slice(0, Math.min(names.length, Math.max(4, count))).map((name, i) => {
    const insc = r0(rng.range(120, 900) * ctx.brand.scale + 40);
    const pres = r0(insc * rng.range(0.45, 0.78));
    const leads = r0(pres * rng.range(0.18, 0.4));
    return { evento: name, data: `${String(2 + i * 3).padStart(2, "0")}/11`, tipo: types[i % types.length] ?? "Webinar", inscritos: insc, presentes: pres, leads, pipeline: leads * rng.range(2200, 5200) };
  });
  const participants = list.reduce((a, e) => a + e.presentes, 0);
  const inscritos = list.reduce((a, e) => a + e.inscritos, 0);
  const leads = list.reduce((a, e) => a + e.leads, 0);
  const cost = rng.vary(40000, 0.15) * vol;
  return {
    kpis: [
      kpi(ctx, "Eventos Realizados", count, "number"),
      kpi(ctx, "Participantes", participants, "number"),
      kpi(ctx, "Taxa de Comparecimento", (participants / inscritos) * 100, "percent"),
      kpi(ctx, "Leads Gerados", leads, "number"),
      kpi(ctx, "Custo por Lead", cost / Math.max(1, leads), "currency", { invert: true }),
    ],
    charts: [
      {
        kind: "vbar",
        title: "Inscritos vs. Presentes",
        subtitle: "Comparecimento por evento",
        format: "number",
        valueLabel: "Inscritos",
        secondaryLabel: "Presentes",
        data: list.map((e) => ({ name: e.evento.split(" ")[0] ?? e.evento, value: e.inscritos, secondary: e.presentes })),
      },
      {
        kind: "donut",
        title: "Leads por Tipo de Evento",
        format: "number",
        data: types.map((t) => ({ name: t, value: list.filter((e) => e.tipo === t).reduce((a, e) => a + e.leads, 0) || r0(rng.range(10, 40)) })),
      },
    ],
    table: {
      title: "Agenda de Eventos",
      subtitle: "Resultados por evento no período",
      columns: [
        { key: "evento", label: "Evento", format: "text" },
        { key: "data", label: "Data", format: "text" },
        { key: "tipo", label: "Tipo", format: "status", tones: { Webinar: "neutral", Feira: "success", Workshop: "neutral", Meetup: "neutral" } },
        { key: "inscritos", label: "Inscritos", format: "number", align: "right" },
        { key: "presentes", label: "Presentes", format: "number", align: "right" },
        { key: "leads", label: "Leads", format: "number", align: "right" },
        { key: "pipeline", label: "Pipeline Gerado", format: "currency", align: "right" },
      ],
      rows: list,
    },
  };
}

function pr(ctx: Ctx): SectionData {
  const { rng, vol } = ctx;
  const mentions = r0(rng.vary(140, 0.15) * vol + 3);
  const reach = mentions * rng.range(60000, 110000);
  const sov = rng.range(18, 34) * (ctx.brand.goalBias / 95);
  const positive = rng.range(58, 78);
  const ave = reach * rng.range(0.012, 0.025);
  const total = trendSeries(ctx, mentions, 0.2, 0.35);
  const outlets = ["Valor Econômico", "Exame", "InfoMoney", "Folha de S.Paulo", "Estadão", "Meio & Mensagem", "StartSe", "Forbes Brasil"];
  const titles = ["anuncia expansão para novas regiões", "aposta em IA para atendimento", "entra no ranking das mais inovadoras", "lança nova linha de produtos", "executiva fala sobre liderança", "fecha parceria estratégica"];
  return {
    kpis: [
      kpi(ctx, "Menções na Mídia", mentions, "number", { spark: total }),
      kpi(ctx, "Alcance Estimado", reach, "number"),
      kpi(ctx, "Share of Voice", sov, "percent"),
      kpi(ctx, "Sentimento Positivo", positive, "percent"),
      kpi(ctx, "Valor de Mídia (AVE)", ave, "currency"),
    ],
    charts: [
      {
        kind: "bar",
        title: "Menções por Sentimento",
        subtitle: "Volume de matérias ao longo do período",
        format: "number",
        stacked: true,
        data: zip(ctx, {
          positivo: total.map((t) => (t * positive) / 100),
          neutro: total.map((t) => (t * (100 - positive) * 0.7) / 100),
          negativo: total.map((t) => (t * (100 - positive) * 0.3) / 100),
        }),
        series: [
          { key: "positivo", label: "Positivo", color: 1 },
          { key: "neutro", label: "Neutro", color: 5 },
          { key: "negativo", label: "Negativo", color: 4 },
        ],
      },
      {
        kind: "donut",
        title: "Share of Voice",
        subtitle: "Participação nas menções do setor",
        format: "percent",
        data: [
          { name: ctx.brand.name, value: r1(sov) },
          { name: "Concorrente 1", value: r1((100 - sov) * 0.4) },
          { name: "Concorrente 2", value: r1((100 - sov) * 0.33) },
          { name: "Outros", value: r1((100 - sov) * 0.27) },
        ],
      },
    ],
    table: {
      title: "Matérias Publicadas",
      columns: [
        { key: "veiculo", label: "Veículo", format: "text" },
        { key: "titulo", label: "Título", format: "text" },
        { key: "tier", label: "Tier", format: "status", tones: { "Tier 1": "success", "Tier 2": "neutral", "Tier 3": "neutral" } },
        { key: "alcance", label: "Alcance", format: "number", align: "right" },
        { key: "sentimento", label: "Sentimento", format: "status", tones: { Positivo: "success", Neutro: "neutral", Negativo: "danger" } },
      ],
      rows: outlets.slice(0, 7).map((v, i) => ({
        veiculo: v,
        titulo: `${ctx.brand.name} ${titles[i % titles.length]}`,
        tier: i < 3 ? "Tier 1" : i < 6 ? "Tier 2" : "Tier 3",
        alcance: r0(rng.range(80000, 2_400_000) / (i + 1)),
        sentimento: rng.next() < positive / 100 ? "Positivo" : rng.next() < 0.75 ? "Neutro" : "Negativo",
      })),
    },
  };
}

function endomarketing(ctx: Ctx): SectionData {
  const { rng, brand } = ctx;
  const enps = rng.range(28, 52) * (brand.goalBias / 95);
  const open = rng.range(62, 84);
  const participation = rng.range(45, 72);
  const employees = r0(rng.vary(820, 0.05) * brand.scale + 60);
  const turnover = rng.range(1.1, 2.6) * (95 / brand.goalBias);
  const areas = ["Comercial", "Marketing", "Tecnologia", "Operações", "Financeiro", "RH"];
  const campaigns = [
    { c: "Programa de Reconhecimento Q4", canal: "Intranet" },
    { c: "Semana da Saúde Mental", canal: "E-mail" },
    { c: "Town Hall com a Diretoria", canal: "Evento" },
    { c: "Pesquisa de Clima 2026", canal: "Formulário" },
    { c: "Onboarding Cultural", canal: "Slack" },
    { c: "Campanha de Indicação de Talentos", canal: "E-mail" },
  ];
  return {
    kpis: [
      kpi(ctx, "eNPS", enps, "score", { spark: levelSeries(ctx, enps, 0.2) }),
      kpi(ctx, "Abertura de Comunicados", open, "percent"),
      kpi(ctx, "Participação em Campanhas", participation, "percent"),
      kpi(ctx, "Colaboradores Ativos", employees, "number"),
      kpi(ctx, "Turnover Mensal", turnover, "percent", { invert: true }),
    ],
    charts: [
      {
        kind: "line",
        title: "Evolução do eNPS",
        subtitle: "Índice de satisfação dos colaboradores",
        format: "score",
        data: zip(ctx, { enps: levelSeries(ctx, enps, 0.25, 0.05), benchmark: ctx.buckets.map(() => 35) }),
        series: [
          { key: "enps", label: "eNPS", color: 1 },
          { key: "benchmark", label: "Benchmark do setor", color: 5 },
        ],
      },
      {
        kind: "hbar",
        title: "Engajamento por Área",
        subtitle: "Participação média nas ações internas",
        format: "percent",
        valueLabel: "Engajamento",
        data: areas.map((name) => ({ name, value: r1(participation * rng.vary(1, 0.25)) })).sort((a, b) => b.value - a.value),
      },
    ],
    table: {
      title: "Campanhas Internas",
      columns: [
        { key: "c", label: "Campanha", format: "text" },
        { key: "canal", label: "Canal", format: "text" },
        { key: "publico", label: "Público", format: "number", align: "right" },
        { key: "alcance", label: "Alcance", format: "percent", align: "right" },
        { key: "engajamento", label: "Engajamento", format: "percent", align: "right" },
        { key: "status", label: "Status", format: "status", tones: { Concluída: "success", "Em andamento": "warning", Planejada: "neutral" } },
      ],
      rows: campaigns.map((c) => ({ ...c, publico: r0(employees * rng.range(0.4, 1)), alcance: r1(rng.range(55, 96)), engajamento: r1(rng.range(25, 75)), status: rng.pick(["Concluída", "Em andamento", "Planejada"]) })),
    },
  };
}

function parcerias(ctx: Ctx): SectionData {
  const { rng, vol, brand } = ctx;
  const partners = r0(rng.vary(64, 0.1) * brand.scale + 6);
  const leads = r0(rng.vary(780, 0.12) * vol);
  const conv = rng.range(8, 16);
  const revenue = leads * (conv / 100) * rng.range(5200, 8200);
  const commission = revenue * rng.range(0.1, 0.16);
  const types = ["Afiliados", "Revendas", "Co-marketing", "Indicação"];
  const names = ["Grupo Horizonte", "Rede Prisma", "Conecta Partners", "Nova Aliança", "TechBridge", "Studio Raiz", "Prime Afiliados"];
  return {
    kpis: [
      kpi(ctx, "Parceiros Ativos", partners, "number"),
      kpi(ctx, "Leads via Parceiros", leads, "number"),
      kpi(ctx, "Receita via Parceiros", revenue, "currency", { spark: trendSeries(ctx, revenue, 0.3) }),
      kpi(ctx, "Taxa de Conversão", conv, "percent"),
      kpi(ctx, "Comissões Pagas", commission, "currency", { invert: true }),
    ],
    charts: [
      {
        kind: "bar",
        title: "Receita por Tipo de Parceria",
        subtitle: "Evolução da receita gerada por canal",
        format: "currency",
        stacked: true,
        data: zip(ctx, {
          afiliados: trendSeries(ctx, revenue * 0.34, 0.3),
          revendas: trendSeries(ctx, revenue * 0.3, 0.2),
          comarketing: trendSeries(ctx, revenue * 0.2, 0.4),
          indicacao: trendSeries(ctx, revenue * 0.16, 0.2),
        }),
        series: [
          { key: "afiliados", label: "Afiliados", color: 1 },
          { key: "revendas", label: "Revendas", color: 2 },
          { key: "comarketing", label: "Co-marketing", color: 3 },
          { key: "indicacao", label: "Indicação", color: 4 },
        ],
      },
      {
        kind: "donut",
        title: "Leads por Tipo de Parceiro",
        format: "number",
        data: types.map((name, i) => ({ name, value: r0(leads * ([0.36, 0.28, 0.2, 0.16][i] ?? 0) * rng.vary(1, 0.1)) })),
      },
    ],
    table: {
      title: "Ranking de Parceiros",
      columns: [
        { key: "parceiro", label: "Parceiro", format: "text" },
        { key: "tipo", label: "Tipo", format: "text" },
        { key: "tier", label: "Tier", format: "status", tones: { Ouro: "success", Prata: "neutral", Bronze: "warning" } },
        { key: "leads", label: "Leads", format: "number", align: "right" },
        { key: "negocios", label: "Negócios", format: "number", align: "right" },
        { key: "receita", label: "Receita", format: "currency", align: "right" },
        { key: "comissao", label: "Comissão", format: "currency", align: "right" },
      ],
      rows: names
        .map((n) => {
          const l = r0((leads / names.length) * rng.range(0.4, 1.8));
          const d = r0(l * (conv / 100) * rng.vary(1, 0.3));
          const rev = d * rng.range(5200, 8200);
          return { parceiro: n, tipo: rng.pick(types), leads: l, negocios: d, receita: rev, comissao: rev * 0.12 };
        })
        .sort((a, b) => b.receita - a.receita)
        .map((r, i) => ({ ...r, tier: i < 2 ? "Ouro" : i < 5 ? "Prata" : "Bronze" })),
    },
  };
}

const BUILDERS: Record<string, (ctx: Ctx) => SectionData> = {
  revops,
  "site-seo": siteSeo,
  "meta-ads": metaAds,
  instagram,
  facebook,
  eventos,
  pr,
  endomarketing,
  parcerias,
};

export function getSectionData(brand: Brand, sectionId: string, period: PeriodState): SectionData | undefined {
  const build = BUILDERS[sectionId];
  return build ? build(makeCtx(brand, sectionId, period)) : undefined;
}

export const SECTION_BUILDER_IDS = Object.keys(BUILDERS);
