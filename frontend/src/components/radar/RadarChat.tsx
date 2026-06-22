import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type RadarMessage = {
  id: string;
  role: "radar" | "user";
  text: string;
  list?: string[];
  showDisclaimer?: boolean;
};

export type RadarChatProps = {
  greeting?: string;
  suggestions?: string[];
  messages?: RadarMessage[];
  onAsk?: (question: string) => void | Promise<void>;
  loading?: boolean;
  className?: string;
};

const DEFAULT_GREETING =
  "Oi! Pergunte sobre os alunos em risco ou a visão geral da sua comunidade.";

const DEFAULT_SUGGESTIONS = [
  "Quem vai desistir essa semana?",
  "Quem merece um parabéns?",
  "Como está a aderência geral?",
];

function Disclaimer() {
  return (
    <div className="mt-2.5 flex items-center gap-1.5 border-t border-border pt-2 text-[11px] text-muted-foreground">
      <span
        className="inline-flex size-3.5 shrink-0 items-center justify-center rounded-full border border-muted-foreground/60 text-[9px] font-bold italic"
        aria-hidden
      >
        i
      </span>
      Sugestão, não orientação médica.
    </div>
  );
}

export function RadarChat({
  greeting = DEFAULT_GREETING,
  suggestions = DEFAULT_SUGGESTIONS,
  messages: controlledMessages,
  onAsk,
  loading = false,
  className,
}: RadarChatProps) {
  const [internalMessages, setInternalMessages] = useState<RadarMessage[]>([
    { id: "greeting", role: "radar", text: greeting },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = controlledMessages ?? internalMessages;

  useEffect(() => {
    if (!controlledMessages) {
      setInternalMessages([{ id: "greeting", role: "radar", text: greeting }]);
    }
  }, [greeting, controlledMessages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const submit = async (question: string) => {
    const q = question.trim();
    if (!q || loading) return;

    if (!controlledMessages) {
      setInternalMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: "user", text: q },
      ]);
    }
    setInput("");
    await onAsk?.(q);
  };

  return (
    <div
      className={cn(
        "flex h-full min-h-[420px] flex-col overflow-hidden rounded-[14px] border border-border shadow-[0_8px_30px_rgba(0,0,0,0.35)]",
        className,
      )}
      style={{
        background: "linear-gradient(180deg, hsl(215 18% 14.5%), hsl(215 22% 11%))",
      }}
    >
      <div className="relative flex items-center gap-3 border-b border-border bg-gradient-to-r from-primary/7 to-transparent px-5 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-primary/30 bg-primary/15">
          <span
            className="size-3 rotate-45 rounded-[3px] bg-primary shadow-[0_0_14px_hsl(var(--primary))]"
            aria-hidden
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] font-bold tracking-tight text-foreground">
            Pergunte ao Radar
          </span>
          <span className="text-xs text-muted-foreground">
            Copiloto de retenção · lê os sinais da sua comunidade
          </span>
        </div>
      </div>

      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-1.5 pt-4">
        {messages.map((msg) =>
          msg.role === "radar" ? (
            <div key={msg.id} className="mb-3.5 flex max-w-full items-start gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/15 text-xs font-extrabold text-primary">
                R
              </div>
              <div className="min-w-0 flex-1 rounded-[4px_14px_14px_14px] border border-border bg-secondary px-3.5 py-3">
                <p className="text-[13.5px] leading-relaxed text-foreground/90">{msg.text}</p>
                {msg.list && msg.list.length > 0 ? (
                  <ul className="mt-2.5 flex flex-col gap-2">
                    {msg.list.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-[13px] leading-snug text-foreground/85"
                      >
                        <span
                          className="mt-1.5 size-1 shrink-0 rounded-full bg-primary"
                          aria-hidden
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {msg.showDisclaimer ? <Disclaimer /> : null}
              </div>
            </div>
          ) : (
            <div key={msg.id} className="mb-3.5 flex justify-end">
              <div className="max-w-[82%] rounded-[14px_4px_14px_14px] border border-primary/30 bg-primary/15 px-3 py-2.5 text-[13.5px] leading-snug text-primary-foreground/90">
                {msg.text}
              </div>
            </div>
          ),
        )}
        {loading ? (
          <div className="mb-3.5 flex items-start gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/15 text-xs font-extrabold text-primary">
              R
            </div>
            <div className="rounded-[4px_14px_14px_14px] border border-border bg-secondary px-3.5 py-3 text-sm text-muted-foreground">
              Pensando…
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2.5 border-t border-border px-5 py-3.5">
        <div className="flex flex-wrap gap-2">
          {suggestions.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => submit(sug)}
              disabled={loading}
              className="cursor-pointer rounded-full border border-primary/30 bg-primary/8 px-3.5 py-2 text-[12.5px] font-semibold text-primary transition-colors hover:border-primary/50 hover:bg-primary/15 disabled:opacity-50"
            >
              {sug}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua pergunta…"
            disabled={loading}
            aria-label="Pergunta ao Radar"
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            Enviar
          </Button>
        </form>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span
            className="inline-flex size-3.5 shrink-0 items-center justify-center rounded-full border border-muted-foreground/50 text-[9px] font-bold italic"
            aria-hidden
          >
            i
          </span>
          As respostas do Radar são sugestões — não substituem orientação médica.
        </div>
      </div>
    </div>
  );
}
