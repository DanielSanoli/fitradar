import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import { spaceApi } from "@/lib/api/space-api";
import type { CreatorSpaceRequest } from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const SWATCHES = [
  "hsl(165 76% 48%)",
  "hsl(210 80% 58%)",
  "hsl(280 65% 58%)",
  "hsl(38 100% 56%)",
  "hsl(0 72% 67%)",
  "hsl(200 70% 50%)",
];

const STEPS = [
  { n: 1, label: "Identidade", sub: "Nome e visual" },
  { n: 2, label: "Endereço", sub: "Slug e link" },
  { n: 3, label: "Publicar", sub: "Revisar e salvar" },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function SpaceBuilderPage() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loadState, setLoadState] = useState<"loading" | "error" | "content">("loading");
  const [loadError, setLoadError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState(SWATCHES[0]);
  const [bio, setBio] = useState("");

  const initials = useMemo(() => {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "FR";
  }, [name]);

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const s = await spaceApi.get();
      setName(s.name ?? "");
      setSlug(s.slug ?? "");
      setLogoUrl(s.logoUrl ?? "");
      setPrimaryColor(s.primaryColor ?? SWATCHES[0]);
      setBio(s.bio ?? "");
      setLoadState("content");
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setLoadState("content");
        return;
      }
      setLoadError(e instanceof ApiError ? e.message : "Erro ao carregar espaço.");
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const body: CreatorSpaceRequest = {
        name: name.trim(),
        slug: slug.trim() || null,
        logoUrl: logoUrl.trim() || null,
        primaryColor: primaryColor || null,
        bio: bio.trim() || null,
      };
      await spaceApi.update(body);
      setSaved(true);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro ao salvar.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loadState !== "content") {
    return (
      <PanelState
        state={loadState}
        message={loadError}
        onRetry={load}
        className="min-h-[40vh]"
      />
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Passo {step} de 3</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Construtor do Espaço</h1>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {STEPS.map((st) => (
            <button
              key={st.n}
              type="button"
              onClick={() => setStep(st.n)}
              className={cn(
                "flex flex-1 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                step === st.n
                  ? "border-primary/40 bg-primary/10"
                  : "border-border bg-card hover:bg-secondary/50",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  step > st.n ? "bg-primary text-primary-foreground" : "border border-border",
                )}
              >
                {step > st.n ? "✓" : st.n}
              </span>
              <span>
                <span className="block text-sm font-semibold">{st.label}</span>
                <span className="text-xs text-muted-foreground">{st.sub}</span>
              </span>
            </button>
          ))}
        </div>

        {step === 1 ? (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold">A identidade do seu espaço</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Dê um nome, uma cara e uma voz para sua comunidade.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="space-name">Nome do espaço</Label>
              <Input
                id="space-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Studio Corpo & Movimento"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="space-logo">URL do logo (opcional)</Label>
              <Input
                id="space-logo"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-2">
              <Label>Cor de destaque</Label>
              <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-3">
                {SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    title={hex}
                    onClick={() => setPrimaryColor(hex)}
                    className={cn(
                      "size-9 rounded-full border-2 transition-transform hover:scale-105",
                      primaryColor === hex ? "border-white" : "border-transparent",
                    )}
                    style={{ background: hex }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="space-bio">Bio do espaço</Label>
                <span className="text-xs text-muted-foreground">{bio.length}/140</span>
              </div>
              <textarea
                id="space-bio"
                maxLength={140}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Conte em uma frase o que torna seu espaço especial."
                className="min-h-[84px] w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <Button onClick={() => setStep(2)} disabled={!name.trim()}>
              Continuar
            </Button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold">Endereço do espaço</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Escolha um slug único para compartilhar com seus alunos.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="space-slug">Slug</Label>
              <div className="flex gap-2">
                <Input
                  id="space-slug"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder="studio-corpo-movimento"
                />
                <Button type="button" variant="outline" onClick={() => setSlug(slugify(name))}>
                  Gerar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                fitradar.app/{slug || "seu-slug"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button onClick={() => setStep(3)}>Continuar</Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold">Revisar e publicar</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Confira os dados antes de salvar seu espaço.
              </p>
            </div>
            <Card>
              <CardContent className="space-y-2 pt-4 text-sm">
                <p>
                  <span className="text-muted-foreground">Nome:</span> {name || "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Slug:</span> {slug || "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Cor:</span>{" "}
                  <span
                    className="inline-block size-4 rounded-full align-middle"
                    style={{ background: primaryColor }}
                  />
                </p>
                <p>
                  <span className="text-muted-foreground">Bio:</span> {bio || "—"}
                </p>
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button onClick={() => void save()} disabled={saving || !name.trim()}>
                {saving ? "Salvando…" : "Publicar espaço"}
              </Button>
            </div>
            {saved ? (
              <p className="text-sm font-medium text-primary">Espaço salvo com sucesso!</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <Card className="sticky top-20 h-fit overflow-hidden border-border">
        <div className="h-1" style={{ background: primaryColor }} />
        <CardContent className="space-y-4 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pré-visualização
          </p>
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="size-12 rounded-xl object-cover" />
            ) : (
              <div
                className="flex size-12 items-center justify-center rounded-xl text-sm font-bold"
                style={{
                  background: `${primaryColor}22`,
                  border: `1px solid ${primaryColor}55`,
                  color: primaryColor,
                }}
              >
                {initials}
              </div>
            )}
            <div>
              <p className="font-bold">{name || "Seu espaço"}</p>
              <p className="text-xs text-muted-foreground">/{slug || "slug"}</p>
            </div>
          </div>
          {bio ? <p className="text-sm text-muted-foreground">{bio}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
