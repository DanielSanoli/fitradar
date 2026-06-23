import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RADAR_DISCLAIMER, stripRadarDisclaimer } from "@/lib/radar/radar-disclaimer";
import { cn } from "@/lib/utils";

export type RadarMessage = {
  id: string;
  role: "radar" | "user";
  text: string;
  list?: string[];
};

export type RadarChatProps = {
  greeting?: string;
  suggestions?: string[];
  messages?: RadarMessage[];
  onAsk?: (question: string) => void | Promise<void>;
  loading?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
  embedded?: boolean;
};

const DEFAULT_GREETING =
  "Oi! Pergunte sobre os alunos em risco ou a visão geral da sua comunidade.";

const DEFAULT_SUGGESTIONS = [
  "Quem vai desistir essa semana?",
  "Quem merece um parabéns?",
  "Como está a aderência geral?",
];

function RadarDisclaimerFooter() {
  return (
    <p className="flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
      <span
        className="mt-px inline-flex size-3.5 shrink-0 items-center justify-center rounded-full border border-muted-foreground/50 text-[9px] font-bold italic"
        aria-hidden
      >
        i
      </span>
      {RADAR_DISCLAIMER}
    </p>
  );
}

export function RadarChat({
  greeting = DEFAULT_GREETING,
  suggestions = DEFAULT_SUGGESTIONS,
  messages: controlledMessages,
  onAsk,
  loading = false,
  className,
  title = "Pergunte ao Radar",
  subtitle = "Copiloto de retenção · lê os sinais da sua comunidade",
  embedded = false,
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

  const panelBackground = "linear-gradient(180deg, hsl(215 18% 14.5%), hsl(215 22% 11%))";

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden",
        embedded
          ? "h-full"
          : "min-h-[420px] rounded-[14px] border border-border shadow-[0_8px_30px_rgba(0,0,0,0.35)]",
        className,
      )}
      style={{ background: panelBackground }}
    >
      <div
        className="shrink-0 border-b border-border px-5 py-4 pr-12"
        style={{ background: panelBackground }}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-primary/30 bg-primary/15">
            <span
              className="size-3 rotate-45 rounded-[3px] bg-primary shadow-[0_0_14px_hsl(var(--primary))]"
              aria-hidden
            />
          </div>
          <div className="min-w-0 flex flex-col gap-0.5">
            <span className="text-[15px] font-bold tracking-tight text-foreground">{title}</span>
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="radar-chat-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((msg) =>
          msg.role === "radar" ? (
            <div key={msg.id} className="mb-3.5 flex max-w-full items-start gap-2.5">
              <div
                className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/15 text-xs font-extrabold text-primary"
                aria-hidden
              >
                R
              </div>
              <div className="min-w-0 flex-1 rounded-[4px_14px_14px_14px] border border-border bg-secondary px-3.5 py-3">
                <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground/90">
                  {stripRadarDisclaimer(msg.text)}
                </p>
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
              </div>
            </div>
          ) : (
            <div key={msg.id} className="mb-3.5 flex justify-end pl-8">
              <div className="max-w-[82%] rounded-[14px_4px_14px_14px] border border-primary/35 bg-primary/12 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-foreground">
                {msg.text}
              </div>
            </div>
          ),
        )}
        {loading ? (
          <div className="mb-3.5 flex items-start gap-2.5">
            <div
              className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/15 text-xs font-extrabold text-primary"
              aria-hidden
            >
              R
            </div>
            <div className="rounded-[4px_14px_14px_14px] border border-border bg-secondary px-3.5 py-3 text-sm text-muted-foreground">
              Pensando…
            </div>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 space-y-3 border-t border-border bg-card/40 px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {suggestions.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => submit(sug)}
              disabled={loading}
              className="cursor-pointer rounded-full border border-primary/30 bg-primary/8 px-3.5 py-2 text-left text-[12.5px] font-semibold leading-snug text-primary transition-colors hover:border-primary/50 hover:bg-primary/15 disabled:opacity-50"
            >
              {sug}
            </button>
          ))}
        </div>
        <form
          className="flex items-center gap-2"
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
            className="mb-0 flex-1"
          />
          <Button type="submit" disabled={loading || !input.trim()} className="shrink-0">
            Enviar
          </Button>
        </form>
        <RadarDisclaimerFooter />
      </div>
    </div>
  );
}
