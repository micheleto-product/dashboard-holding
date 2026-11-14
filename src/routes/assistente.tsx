import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Lightbulb, Sparkles } from "lucide-react";
import { useAppState } from "@/components/bi/app-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { answer, type AssistantReply } from "@/lib/bi/assistant";
import { periodLabel } from "@/lib/bi/period";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assistente")({
  head: () => ({
    meta: [
      { title: "Assistente IA Executivo · Holding Growth Intelligence" },
      { name: "description", content: "Converse com os dados da holding: receita, ROAS, CAC, metas e leads de cada empresa." },
      { property: "og:title", content: "Assistente IA Executivo" },
      { property: "og:description", content: "Chat analítico para sócios e C-levels da holding." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssistantPage,
});

type Message = { id: number; role: "user" | "assistant"; text?: string; reply?: AssistantReply };

const SUGGESTIONS = [
  "Qual empresa tem o melhor ROAS?",
  "Quais marcas estão abaixo da meta?",
  "Compare o CAC entre as empresas",
  "Como está a geração de leads?",
  "Resuma a saúde do grupo",
];

function AssistantPage() {
  const { period } = useAppState();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q || thinking) return;
    setMessages((m) => [...m, { id: Date.now(), role: "user", text: q }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [...m, { id: Date.now() + 1, role: "assistant", reply: answer(q, period) }]);
      setThinking(false);
    }, 650);
  };

  const empty = messages.length === 0;

  return (
    <div className="mx-auto flex h-[calc(100svh-3.5rem)] max-w-3xl flex-col px-4 md:px-6">
      <div className="flex-1 overflow-y-auto py-6">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="bg-brand-gradient mb-5 flex size-12 items-center justify-center rounded-xl text-primary-foreground shadow-lg">
              <Sparkles className="size-5" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight">Assistente IA Executivo</h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Pergunte sobre receita, investimento, ROAS, CAC, metas e leads de todas as empresas da holding — {periodLabel(period).toLowerCase()}.
            </p>
            <div className="mt-8 flex max-w-xl flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => send(s)} className="rounded-full border bg-card px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((m) => (
              <div key={m.id} className={cn("animate-fade-up flex gap-3", m.role === "user" && "justify-end")}>
                {m.role === "assistant" && (
                  <span className="bg-brand-gradient mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md text-primary-foreground">
                    <Sparkles className="size-3.5" />
                  </span>
                )}
                {m.role === "user" ? (
                  <p className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">{m.text}</p>
                ) : (
                  m.reply && <ReplyView reply={m.reply} />
                )}
              </div>
            ))}
            {thinking && (
              <div className="flex items-center gap-3">
                <span className="bg-brand-gradient flex size-7 items-center justify-center rounded-md text-primary-foreground">
                  <Sparkles className="size-3.5" />
                </span>
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="size-1.5 animate-pulse rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </span>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <form
        className="sticky bottom-0 pb-4"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <div className="surface flex items-end gap-2 p-2 focus-within:ring-1 focus-within:ring-ring">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Pergunte algo sobre os resultados da holding…"
            className="max-h-40 min-h-9 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || thinking} aria-label="Enviar">
            <ArrowUp />
          </Button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">Respostas calculadas a partir dos dados exibidos no painel.</p>
      </form>
    </div>
  );
}

function ReplyView({ reply }: { reply: AssistantReply }) {
  return (
    <div className="min-w-0 flex-1 space-y-3 text-sm leading-relaxed">
      <p>{reply.text}</p>
      {reply.bullets && (
        <ul className="surface divide-y overflow-hidden">
          {reply.bullets.map((b) => (
            <li key={b} className="num px-4 py-2 text-[13px] text-muted-foreground">
              {b}
            </li>
          ))}
        </ul>
      )}
      {reply.recommendation && (
        <p className="flex gap-2 rounded-lg bg-accent px-3.5 py-2.5 text-[13px] text-accent-foreground">
          <Lightbulb className="mt-0.5 size-4 shrink-0" />
          {reply.recommendation}
        </p>
      )}
    </div>
  );
}
