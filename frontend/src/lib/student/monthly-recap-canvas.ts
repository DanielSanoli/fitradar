import type { MonthlyRecapResult } from "@/lib/api/domain-types";

export type MonthlyRecapStoryCardProps = {
  recap: MonthlyRecapResult;
  className?: string;
};

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

const DEFAULT_ACCENT = "#22c55e";

function parseColor(color: string | null | undefined): string {
  if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return DEFAULT_ACCENT;
  }
  return color;
}

function formatDelta(value: number | string | null | undefined, suffix = ""): string | null {
  if (value == null || value === "") return null;
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num) || num === 0) return null;
  const sign = num > 0 ? "+" : "";
  return `${sign}${num}${suffix}`;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function drawMonthlyRecapStory(
  canvas: HTMLCanvasElement,
  recap: MonthlyRecapResult,
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;

  const accent = parseColor(recap.branding.primaryColor);
  const gradient = ctx.createLinearGradient(0, 0, STORY_WIDTH, STORY_HEIGHT);
  gradient.addColorStop(0, shade(accent, -0.55));
  gradient.addColorStop(0.45, "#0f172a");
  gradient.addColorStop(1, "#020617");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  ctx.fillStyle = hexWithAlpha(accent, 0.18);
  ctx.beginPath();
  ctx.arc(STORY_WIDTH * 0.85, STORY_HEIGHT * 0.12, 220, 0, Math.PI * 2);
  ctx.fill();

  const padding = 88;
  let y = padding + 40;

  if (recap.branding.logoUrl) {
    const logo = await loadImage(recap.branding.logoUrl);
    if (logo) {
      const size = 120;
      drawRoundedRect(ctx, padding, y, size, size, 28);
      ctx.save();
      ctx.clip();
      ctx.drawImage(logo, padding, y, size, size);
      ctx.restore();
      y += size + 36;
    }
  }

  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 52px system-ui, sans-serif";
  ctx.fillText(recap.branding.spaceName ?? "FitRadar", padding, y);
  y += 28;

  ctx.fillStyle = hexWithAlpha("#f8fafc", 0.72);
  ctx.font = "600 34px system-ui, sans-serif";
  ctx.fillText("Retrospectiva", padding, y + 40);
  y += 52;

  ctx.fillStyle = accent;
  ctx.font = "800 72px system-ui, sans-serif";
  const monthLines = wrapText(ctx, recap.monthLabel, STORY_WIDTH - padding * 2);
  for (const line of monthLines) {
    ctx.fillText(line, padding, y + 72);
    y += 82;
  }
  y += 48;

  const stats = [
    { label: "Treinos", value: String(recap.workoutsDone), delta: formatDelta(recap.comparison.workoutsDoneDelta) },
    {
      label: "Aderência",
      value: recap.adherence != null ? `${recap.adherence}%` : "—",
      delta: formatDelta(recap.comparison.adherenceDelta, " p.p."),
    },
    { label: "Maior streak", value: String(recap.longestStreakInMonth), delta: formatDelta(recap.comparison.longestStreakDelta, " dias") },
    { label: "XP ganho", value: String(recap.xpEarned), delta: null },
  ];

  const cardW = (STORY_WIDTH - padding * 2 - 32) / 2;
  const cardH = 220;
  stats.forEach((stat, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = padding + col * (cardW + 32);
    const cardY = y + row * (cardH + 32);

    drawRoundedRect(ctx, x, cardY, cardW, cardH, 28);
    ctx.fillStyle = hexWithAlpha("#ffffff", 0.06);
    ctx.fill();
    ctx.strokeStyle = hexWithAlpha(accent, 0.35);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = hexWithAlpha("#f8fafc", 0.65);
    ctx.font = "600 28px system-ui, sans-serif";
    ctx.fillText(stat.label, x + 28, cardY + 52);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "800 64px system-ui, sans-serif";
    ctx.fillText(stat.value, x + 28, cardY + 132);

    if (stat.delta) {
      ctx.fillStyle = accent;
      ctx.font = "700 24px system-ui, sans-serif";
      ctx.fillText(stat.delta + " vs mês anterior", x + 28, cardY + 178);
    }
  });

  y += 2 * (cardH + 32) + 40;

  if (recap.highlightBadge) {
    drawRoundedRect(ctx, padding, y, STORY_WIDTH - padding * 2, 160, 28);
    ctx.fillStyle = hexWithAlpha(accent, 0.12);
    ctx.fill();
    ctx.strokeStyle = hexWithAlpha(accent, 0.4);
    ctx.stroke();

    ctx.fillStyle = hexWithAlpha("#f8fafc", 0.7);
    ctx.font = "600 26px system-ui, sans-serif";
    ctx.fillText("Destaque do mês", padding + 32, y + 52);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "800 40px system-ui, sans-serif";
    ctx.fillText(recap.highlightBadge.label, padding + 32, y + 112);
    y += 200;
  }

  ctx.fillStyle = hexWithAlpha("#f8fafc", 0.45);
  ctx.font = "500 24px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Powered by FitRadar", STORY_WIDTH / 2, STORY_HEIGHT - 72);
  ctx.textAlign = "left";
}

export async function renderMonthlyRecapPng(recap: MonthlyRecapResult): Promise<Blob> {
  const canvas = document.createElement("canvas");
  await drawMonthlyRecapStory(canvas, recap);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Falha ao gerar PNG"));
    }, "image/png");
  });
}

export async function shareMonthlyRecapPng(recap: MonthlyRecapResult): Promise<"shared" | "downloaded"> {
  const blob = await renderMonthlyRecapPng(recap);
  const file = new File([blob], `retrospectiva-${recap.year}-${recap.month}.png`, { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: `Retrospectiva ${recap.monthLabel}`,
      text: `Minha retrospectiva de ${recap.monthLabel}`,
    });
    return "shared";
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}

function hexWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shade(hex: string, amount: number): string {
  const r = clamp(parseInt(hex.slice(1, 3), 16) + amount * 255);
  const g = clamp(parseInt(hex.slice(3, 5), 16) + amount * 255);
  const b = clamp(parseInt(hex.slice(5, 7), 16) + amount * 255);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function toHex(v: number): string {
  return v.toString(16).padStart(2, "0");
}
