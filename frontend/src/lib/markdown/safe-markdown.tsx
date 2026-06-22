import type { ReactNode } from "react";

/** Renderiza markdown básico como React nodes — sem HTML bruto (anti-XSS). */
export function renderSafeMarkdown(content: string): ReactNode[] {
  const lines = content.split(/\r?\n/);
  const nodes: ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    nodes.push(
      <ul key={key++} className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {listItems.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    const bullet = trimmed.match(/^[-*•]\s+(.+)/);
    const numbered = trimmed.match(/^\d+[.)]\s+(.+)/);

    if (bullet) {
      listItems.push(bullet[1]);
      continue;
    }
    if (numbered) {
      listItems.push(numbered[1]);
      continue;
    }

    flushList();

    if (trimmed.startsWith("### ")) {
      nodes.push(
        <h4 key={key++} className="mt-2 text-sm font-semibold text-foreground">
          {trimmed.slice(4)}
        </h4>,
      );
    } else if (trimmed.startsWith("## ")) {
      nodes.push(
        <h3 key={key++} className="mt-2 font-semibold text-foreground">
          {trimmed.slice(3)}
        </h3>,
      );
    } else if (trimmed.startsWith("# ")) {
      nodes.push(
        <h2 key={key++} className="mt-2 font-bold text-foreground">
          {trimmed.slice(2)}
        </h2>,
      );
    } else {
      nodes.push(
        <p key={key++} className="text-sm leading-relaxed text-muted-foreground">
          {trimmed}
        </p>,
      );
    }
  }

  flushList();
  return nodes;
}

export function SafeMarkdown({ content }: { content: string }) {
  if (!content.trim()) return null;
  return <div className="space-y-1.5">{renderSafeMarkdown(content)}</div>;
}
