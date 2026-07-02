import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { SpaceBuilderStepper } from "@/components/creator/space/SpaceBuilderStepper";
import { SpaceAreaSelector } from "@/components/creator/space/SpaceAreaSelector";
import { SpaceModuleSelector } from "@/components/creator/space/SpaceModuleSelector";
import { SpaceFieldLabel } from "@/components/creator/space/SpaceFieldLabel";
import { SpaceLivePreview } from "@/components/creator/space/SpaceLivePreview";
import { FitnessEmptyIcon } from "@/components/fitness/FitnessEmptyIcon";
import { Button } from "@/components/ui/button";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import {
  buildCreatorSpaceUrl,
  copyTextToClipboard,
  formatCreatorSpaceLinkDisplay,
} from "@/lib/app/public-url";
import { programsApi } from "@/lib/api/programs-api";
import { spaceApi } from "@/lib/api/space-api";
import { studentsApi } from "@/lib/api/students-api";
import type { CreatorSpaceRequest, SpaceCategory, SpaceModule } from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";
import { DEFAULT_SPACE_CATEGORY, normalizeSpaceCategory } from "@/lib/creator/space-categories";
import { defaultModulesForCategory, normalizeSpaceModules } from "@/lib/creator/space-modules";
import {
  foregroundOnAccent,
  normalizeAccentColor,
  PROGRAM_DURATIONS,
  rgbaHex,
  slugifySpaceName,
  SPACE_SWATCHES,
  spaceInitials,
} from "@/lib/creator/space-theme";
import {
  isAllowedLogoFile,
  LOGO_ACCEPT,
  LOGO_MAX_BYTES,
  persistableLogoUrl,
} from "@/lib/creator/logo-upload";
import { cn } from "@/lib/utils";

const inputClass =
  "h-[46px] w-full rounded-[11px] border border-border bg-secondary/40 px-3.5 text-[15px] transition-[border-color,box-shadow] focus:outline-none focus:ring-[3px]";

function resolvedLogoUrl(logoUrl: string): string | null {
  return persistableLogoUrl(logoUrl);
}

type SpaceBuilderHeaderProps = {
  greeting: string;
  step: number;
  saving: boolean;
  showSaveDraft: boolean;
  onSaveDraft: () => void;
};

function SpaceBuilderHeader({
  greeting,
  step,
  saving,
  showSaveDraft,
  onSaveDraft,
}: SpaceBuilderHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md md:gap-4 md:px-7">
      <Button variant="outline" size="sm" asChild className="h-9 shrink-0 gap-1.5 rounded-[9px] px-2.5">
        <Link to="/app">
          <ChevronLeft className="size-4" aria-hidden />
          Voltar
        </Link>
      </Button>
      <Link
        to="/app"
        className="flex items-center gap-2 text-base font-extrabold tracking-tight"
        aria-label="FitRadar — voltar ao painel"
      >
        <span className="size-3 rounded-full bg-primary shadow-[0_0_16px_hsl(var(--primary))]" aria-hidden />
        FitRadar
      </Link>
      <span className="hidden h-[22px] w-px bg-border sm:block" aria-hidden />
      <span className="hidden text-[13.5px] text-muted-foreground sm:inline">
        Bem-vindo(a), {greeting} — vamos montar seu espaço
      </span>
      <div className="ml-auto flex items-center gap-3">
        {showSaveDraft ? (
          <>
            <span className="text-[13px] text-muted-foreground">Passo {step} de 3</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-[38px] rounded-[9px]"
              disabled={saving}
              onClick={onSaveDraft}
            >
              Salvar rascunho
            </Button>
          </>
        ) : null}
      </div>
    </header>
  );
}

export function SpaceBuilderPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [loadState, setLoadState] = useState<"loading" | "error" | "content">("loading");
  const [loadError, setLoadError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [accent, setAccent] = useState<string>(SPACE_SWATCHES[0]);
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState<SpaceCategory>(DEFAULT_SPACE_CATEGORY);
  const [modules, setModules] = useState<SpaceModule[]>(defaultModulesForCategory(DEFAULT_SPACE_CATEGORY));

  const [programName, setProgramName] = useState("");
  const [programWeeks, setProgramWeeks] = useState<(typeof PROGRAM_DURATIONS)[number]["weeks"]>("8");
  const [programDesc, setProgramDesc] = useState("");
  const [programId, setProgramId] = useState<string | null>(null);

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [memberCount, setMemberCount] = useState(0);

  const accentFg = foregroundOnAccent(accent);
  const accentSoft = rgbaHex(accent, 0.16);
  const focusStyle = {
    borderColor: accent,
    boxShadow: `0 0 0 3px ${accentSoft}`,
  } as const;

  const slugComputed = slug.trim() || slugifySpaceName(name) || "seu-espaco";
  const spaceUrl = useMemo(() => buildCreatorSpaceUrl(slugComputed), [slugComputed]);
  const spaceLinkDisplay = useMemo(() => formatCreatorSpaceLinkDisplay(spaceUrl), [spaceUrl]);

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const [space, programs, students] = await Promise.all([
        spaceApi.get().catch((e: unknown) => {
          if (e instanceof ApiError && e.status === 404) return null;
          throw e;
        }),
        programsApi.list().catch(() => []),
        studentsApi.list(0, 1).catch(() => ({ content: [], totalElements: 0 })),
      ]);

      if (space) {
        const loadedName = space.name ?? "";
        const loadedSlug = space.slug ?? "";
        setName(loadedName);
        setSlug(loadedSlug);
        setSlugManual(
          Boolean(loadedSlug && loadedSlug !== slugifySpaceName(loadedName)),
        );
        setLogoUrl(space.logoUrl ?? "");
        setLogoPreview(space.logoUrl ?? null);
        setAccent(normalizeAccentColor(space.primaryColor));
        setBio(space.bio ?? "");
        setCategory(normalizeSpaceCategory(space.category));
        setModules(normalizeSpaceModules(space.modules ?? defaultModulesForCategory(space.category)));
        if (space.slug && space.name) setPublished(true);
      }

      const first = programs[0];
      if (first) {
        setProgramId(first.id);
        setProgramName(first.title);
        setProgramDesc(first.description ?? "");
      }

      setMemberCount(students.totalElements ?? students.content.length);
      setLoadState("content");
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : "Erro ao carregar espaço.");
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!slugManual) {
      setSlug(slugifySpaceName(name));
    }
  }, [name, slugManual]);

  const spaceBody = useMemo((): CreatorSpaceRequest => {
    return {
      name: name.trim(),
      slug: slugComputed || null,
      logoUrl: resolvedLogoUrl(logoUrl),
      primaryColor: accent,
      bio: bio.trim() || null,
      category,
      modules,
    };
  }, [name, slugComputed, logoUrl, accent, bio, category, modules]);

  const saveDraft = async () => {
    if (!name.trim()) {
      toast("Informe o nome do espaço antes de salvar.", "error");
      return;
    }
    setSaving(true);
    try {
      await spaceApi.update(spaceBody);
      toast("Rascunho salvo.");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro ao salvar rascunho.", "error");
    } finally {
      setSaving(false);
    }
  };

  const ensureProgram = async () => {
    if (programId) {
      if (programName.trim()) {
        await programsApi.update(programId, {
          title: programName.trim(),
          description: programDesc.trim() || null,
        });
      }
      return programId;
    }
    if (!programName.trim()) return null;
    const created = await programsApi.create({
      title: programName.trim(),
      description: programDesc.trim() || null,
      active: true,
    });
    setProgramId(created.id);
    return created.id;
  };

  const copyLink = async () => {
    if (await copyTextToClipboard(spaceUrl)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      toast("Não foi possível copiar o link.", "error");
    }
  };

  const onLogoPick = async (file: File | null) => {
    if (!file) return;
    if (!isAllowedLogoFile(file)) {
      toast("Use PNG, JPG, WebP ou SVG.", "error");
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      toast("Logo deve ter até 2 MB.", "error");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setLogoPreview(localPreview);
    setLogoFileName(file.name);
    setLogoUploading(true);
    setPublished(false);

    try {
      const { logoUrl: uploadedUrl } = await spaceApi.uploadLogo(file);
      setLogoUrl(uploadedUrl);
      setLogoPreview(uploadedUrl);
      toast("Logo enviado.");
    } catch (e) {
      setLogoPreview(null);
      setLogoFileName(null);
      setLogoUrl("");
      toast(e instanceof ApiError ? e.message : "Erro ao enviar logo.", "error");
    } finally {
      URL.revokeObjectURL(localPreview);
      setLogoUploading(false);
    }
  };

  const onLogoUrlChange = (value: string) => {
    setLogoUrl(value);
    setPublished(false);
    const trimmed = value.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/uploads/logos/")) {
      setLogoPreview(trimmed);
    }
  };

  const goNext = async () => {
    if (step === 1) {
      if (!name.trim()) {
        toast("Informe o nome do espaço.", "error");
        return;
      }
      setSaving(true);
      try {
        await spaceApi.update(spaceBody);
        setStep(2);
      } catch (e) {
        toast(e instanceof ApiError ? e.message : "Erro ao salvar.", "error");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (step === 2) {
      setSaving(true);
      try {
        await spaceApi.update(spaceBody);
        await ensureProgram();
        setStep(3);
      } catch (e) {
        toast(e instanceof ApiError ? e.message : "Erro ao salvar programa.", "error");
      } finally {
        setSaving(false);
      }
    }
  };

  const publish = async () => {
    setSaving(true);
    try {
      await spaceApi.update(spaceBody);
      await ensureProgram();
      setPublished(true);
      await copyLink();
      toast("Espaço publicado e no ar.");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro ao publicar.", "error");
    } finally {
      setSaving(false);
    }
  };

  const sendInvite = async () => {
    if (!inviteName.trim()) {
      toast("Informe o nome do aluno.", "error");
      return;
    }
    if (!inviteEmail.trim()) {
      toast("Informe o e-mail do aluno.", "error");
      return;
    }
    setInviting(true);
    try {
      await studentsApi.invite({ name: inviteName.trim(), email: inviteEmail.trim() });
      setInviteName("");
      setInviteEmail("");
      toast("Convite enviado.");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro ao convidar.", "error");
    } finally {
      setInviting(false);
    }
  };

  const greeting = user?.name?.split(" ")[0] ?? "criador";
  const displayName = name.trim() || "Seu espaço aqui";
  const displayBio =
    bio.trim() || "Sua bio aparece aqui — conte o que torna seu espaço especial.";
  const showProgram = programName.trim().length > 0 || step >= 2;

  if (loadState !== "content") {
    return (
      <>
        <SpaceBuilderHeader
          greeting={greeting}
          step={step}
          saving={saving}
          showSaveDraft={false}
          onSaveDraft={() => void saveDraft()}
        />
        <PanelState
          state={loadState}
          message={loadError}
          onRetry={load}
          className="mx-auto min-h-[50vh] max-w-lg p-8"
        />
      </>
    );
  }

  return (
    <>
      <SpaceBuilderHeader
        greeting={greeting}
        step={step}
        saving={saving}
        showSaveDraft
        onSaveDraft={() => void saveDraft()}
      />

      <div className="grid flex-1 grid-cols-1 items-start lg:grid-cols-2">
        <main
          id="main-content"
          className="mx-auto flex w-full max-w-[620px] flex-col gap-6 px-5 py-8 md:px-10 md:py-9"
        >
          <SpaceBuilderStepper step={step} accent={accent} onStep={setStep} />

          {step === 1 ? (
            <div className="flex animate-in fade-in slide-in-from-bottom-2 flex-col gap-6 duration-300">
              <div className="flex items-start gap-3">
                <FitnessEmptyIcon context="space" variant="creator" className="size-12 shrink-0 rounded-xl" />
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">
                    A identidade do seu espaço
                  </h1>
                  <p className="mt-1.5 text-[14.5px] text-muted-foreground">
                    Dê um nome, uma cara e uma voz. Tudo o que você mudar aqui aparece na hora na
                    pré-visualização ao lado.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <SpaceFieldLabel htmlFor="space-name" icon="space">
                  Nome do espaço
                </SpaceFieldLabel>
                <input
                  id="space-name"
                  className={inputClass}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setPublished(false);
                  }}
                  placeholder="Ex.: Studio Corpo & Movimento"
                  onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                  onBlur={(e) => {
                    e.target.style.borderColor = "";
                    e.target.style.boxShadow = "";
                  }}
                />
              </div>

              <div className="space-y-2">
                <SpaceFieldLabel htmlFor="space-slug" icon="overview">
                  Endereço do link
                </SpaceFieldLabel>
                <div className="flex h-[46px] items-center overflow-hidden rounded-[11px] border border-border bg-secondary/40">
                  <span className="shrink-0 border-r border-border px-3 font-mono text-[13px] text-muted-foreground">
                    /c/
                  </span>
                  <input
                    id="space-slug"
                    className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-[14px] focus:outline-none"
                    value={slug}
                    onChange={(e) => {
                      setSlugManual(true);
                      setSlug(slugifySpaceName(e.target.value));
                      setPublished(false);
                    }}
                    placeholder="seu-espaco"
                    aria-describedby="space-slug-hint"
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                    onBlur={(e) => {
                      e.target.style.borderColor = "";
                      e.target.style.boxShadow = "";
                    }}
                  />
                </div>
                <p id="space-slug-hint" className="font-mono text-[11.5px] text-muted-foreground">
                  Link completo: {spaceLinkDisplay}
                </p>
              </div>

              <div className="space-y-2.5">
                <SpaceFieldLabel icon="programs">Área do espaço</SpaceFieldLabel>
                <p className="text-[13px] text-muted-foreground">
                  Define o ícone representativo do seu nicho na vitrine e no app dos alunos.
                </p>
                <SpaceAreaSelector
                  value={category}
                  onChange={(next) => {
                    setCategory(next);
                    setPublished(false);
                  }}
                  accent={accent}
                />
              </div>

              <div className="space-y-2.5">
                <SpaceFieldLabel icon="programs">O que você oferece?</SpaceFieldLabel>
                <p className="text-[13px] text-muted-foreground">
                  Escolha Treino, Nutrição ou ambos. Você precisa de ao menos um módulo ativo.
                </p>
                <SpaceModuleSelector
                  value={modules}
                  onChange={(next) => {
                    setModules(next);
                    setPublished(false);
                  }}
                  accent={accent}
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="min-w-[200px] flex-1 space-y-2">
                  <SpaceFieldLabel icon="overview">Logo</SpaceFieldLabel>
                  <input
                    ref={fileRef}
                    type="file"
                    accept={LOGO_ACCEPT}
                    className="sr-only"
                    disabled={logoUploading}
                    onChange={(e) => void onLogoPick(e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={logoUploading}
                    aria-busy={logoUploading}
                    className="flex h-[72px] w-full items-center gap-3 rounded-[13px] border border-dashed border-border bg-card/80 px-4 text-left transition-colors hover:border-[var(--logo-hover)] hover:bg-card disabled:opacity-60"
                    style={{ "--logo-hover": accent } as React.CSSProperties}
                  >
                    <span
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl text-base font-extrabold"
                      style={{
                        background: `linear-gradient(140deg, ${accent}, ${rgbaHex(accent, 0.7)})`,
                        color: accentFg,
                      }}
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="" className="size-full rounded-xl object-cover" />
                      ) : (
                        spaceInitials(name)
                      )}
                    </span>
                    <span>
                      <span className="block text-[13px] font-semibold">
                        {logoUploading
                          ? "Enviando logo…"
                          : logoFileName ?? "Arraste ou clique para enviar"}
                      </span>
                      <span className="block text-[11.5px] text-muted-foreground">
                        PNG ou SVG · até 2 MB
                      </span>
                    </span>
                  </button>
                  <input
                    id="space-logo-url"
                    type="url"
                    value={logoUrl.startsWith("blob:") || logoUrl.startsWith("data:") ? "" : logoUrl}
                    onChange={(e) => onLogoUrlChange(e.target.value)}
                    placeholder="https://… (URL pública, opcional)"
                    className={cn(inputClass, "mt-2 h-10 text-sm")}
                    aria-describedby="logo-url-hint"
                  />
                  <p id="logo-url-hint" className="text-[11px] text-muted-foreground">
                    Ou cole uma URL pública (https) se preferir hospedar fora.
                  </p>
                </div>

                <div className="min-w-[200px] flex-1 space-y-2">
                  <SpaceFieldLabel icon="adherence">Cor de destaque</SpaceFieldLabel>
                  <div className="flex h-[72px] items-center gap-2.5 rounded-[13px] border border-border bg-card/80 px-3.5">
                    {SPACE_SWATCHES.map((hex) => {
                      const on = hex === accent;
                      return (
                        <button
                          key={hex}
                          type="button"
                          title={hex}
                          aria-label={`Cor ${hex}`}
                          aria-pressed={on}
                          onClick={() => {
                            setAccent(hex);
                            setPublished(false);
                          }}
                          className="size-[30px] rounded-[9px] border transition-transform"
                          style={{
                            background: hex,
                            borderColor: rgbaHex(hex, 0.6),
                            transform: on ? "scale(1.12)" : "scale(1)",
                            boxShadow: on
                              ? `0 0 0 2px hsl(215 18% 12%), 0 0 0 4px ${hex}`
                              : "none",
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <SpaceFieldLabel
                  htmlFor="space-bio"
                  icon="healthy"
                  trailing={
                    <span className="text-[11.5px] text-muted-foreground">{bio.length}/140</span>
                  }
                >
                  Bio do espaço
                </SpaceFieldLabel>
                <textarea
                  id="space-bio"
                  maxLength={140}
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value);
                    setPublished(false);
                  }}
                  placeholder="Conte em uma frase o que torna seu espaço especial."
                  className="min-h-[84px] w-full resize-none rounded-[11px] border border-border bg-secondary/40 px-3.5 py-3 text-[14.5px] leading-relaxed focus:outline-none focus:ring-[3px]"
                  onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                  onBlur={(e) => {
                    e.target.style.borderColor = "";
                    e.target.style.boxShadow = "";
                  }}
                />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="flex animate-in fade-in slide-in-from-bottom-2 flex-col gap-6 duration-300">
              <div className="flex items-start gap-3">
                <FitnessEmptyIcon context="programs" variant="creator" className="size-12 shrink-0 rounded-xl" />
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">Seu primeiro programa</h1>
                  <p className="mt-1.5 text-[14.5px] text-muted-foreground">
                    Um espaço vivo começa com um programa. Crie um agora — você refina os treinos depois.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <SpaceFieldLabel htmlFor="prog-name" icon="programs">
                  Nome do programa
                </SpaceFieldLabel>
                <input
                  id="prog-name"
                  className={inputClass}
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  placeholder="Ex.: Base de Força"
                />
              </div>

              <div className="space-y-2">
                <SpaceFieldLabel icon="checkIn">Duração</SpaceFieldLabel>
                <div className="flex flex-wrap gap-2">
                  {PROGRAM_DURATIONS.map((d) => {
                    const on = d.weeks === programWeeks;
                    return (
                      <button
                        key={d.weeks}
                        type="button"
                        onClick={() => setProgramWeeks(d.weeks)}
                        className={cn(
                          "h-10 rounded-[10px] border px-4 text-[13.5px] font-semibold transition-colors",
                          on
                            ? "border-[var(--dur-border)] bg-[var(--dur-bg)] text-foreground"
                            : "border-border bg-transparent text-muted-foreground",
                        )}
                        style={
                          on
                            ? ({
                                "--dur-border": rgbaHex(accent, 0.4),
                                "--dur-bg": rgbaHex(accent, 0.16),
                              } as React.CSSProperties)
                            : undefined
                        }
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <SpaceFieldLabel htmlFor="prog-desc" icon="goal">
                  Descrição curta
                </SpaceFieldLabel>
                <textarea
                  id="prog-desc"
                  maxLength={160}
                  value={programDesc}
                  onChange={(e) => setProgramDesc(e.target.value)}
                  placeholder="Para quem é e o que promete."
                  className="min-h-[84px] w-full resize-none rounded-[11px] border border-border bg-secondary/40 px-3.5 py-3 text-[14.5px] leading-relaxed"
                />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="flex animate-in fade-in slide-in-from-bottom-2 flex-col gap-6 duration-300">
              <div className="flex items-start gap-3">
                <FitnessEmptyIcon context="invite" variant="creator" className="size-12 shrink-0 rounded-xl" />
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">Convide seu primeiro aluno</h1>
                  <p className="mt-1.5 text-[14.5px] text-muted-foreground">
                    Seu espaço está pronto para receber gente. Compartilhe o link ou mande um convite
                    direto.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <SpaceFieldLabel icon="space">Link do espaço</SpaceFieldLabel>
                <div className="flex gap-2.5">
                  <div className="flex h-[46px] min-w-0 flex-1 items-center overflow-hidden rounded-[11px] border border-border bg-secondary/40 px-3.5 font-mono text-sm text-foreground/85">
                    <span className="truncate">{spaceLinkDisplay}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-[46px] shrink-0 rounded-[11px] px-4",
                      copied && "border-primary/40 bg-primary/10 text-primary",
                    )}
                    onClick={() => void copyLink()}
                  >
                    {copied ? "✓ Copiado" : "Copiar link"}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <SpaceFieldLabel htmlFor="invite-name" icon="students">
                    Nome do aluno
                  </SpaceFieldLabel>
                  <input
                    id="invite-name"
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Ex.: Lucas Ferreira"
                    className={inputClass}
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-2">
                  <SpaceFieldLabel htmlFor="invite-email" icon="students">
                    Ou convide por e-mail
                  </SpaceFieldLabel>
                  <div className="flex gap-2.5">
                    <input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="aluno@email.com"
                      className={cn(inputClass, "min-w-0 flex-1")}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-[46px] shrink-0 rounded-[11px] px-4"
                      disabled={inviting}
                      onClick={() => void sendInvite()}
                    >
                      {inviting ? "Enviando…" : "Enviar convite"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-1 flex items-center gap-3">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                className="h-[46px] rounded-[11px] px-5"
                onClick={() => setStep((s) => s - 1)}
              >
                Voltar
              </Button>
            ) : null}
            {step < 3 ? (
              <Button
                type="button"
                disabled={saving}
                className="h-[46px] rounded-[11px] px-6 font-bold shadow-[0_6px_20px_var(--btn-shadow)]"
                style={
                  {
                    background: accent,
                    color: accentFg,
                    "--btn-shadow": rgbaHex(accent, 0.28),
                  } as React.CSSProperties
                }
                onClick={() => void goNext()}
              >
                {step === 1 ? "Continuar para o programa" : "Continuar para o convite"}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={saving}
                className="h-[46px] rounded-[11px] px-6 font-bold shadow-[0_6px_20px_var(--btn-shadow)]"
                style={
                  {
                    background: accent,
                    color: accentFg,
                    "--btn-shadow": rgbaHex(accent, 0.28),
                  } as React.CSSProperties
                }
                onClick={() => void publish()}
              >
                {saving ? "Publicando…" : "Publicar espaço"}
              </Button>
            )}
            <span className="ml-auto text-[12.5px] text-muted-foreground">Leva uns 3 minutos</span>
          </div>
        </main>

        <aside className="mx-auto w-full max-w-[640px] px-5 py-8 md:px-10 md:py-9 lg:mx-0" aria-label="Pré-visualização">
          <SpaceLivePreview
            accent={accent}
            fullLink={spaceLinkDisplay}
            displayName={displayName}
            displayBio={displayBio}
            category={category}
            logoPreview={logoPreview}
            programName={programName}
            programDesc={programDesc}
            programWeeks={programWeeks}
            memberCount={memberCount}
            showProgram={showProgram}
            published={published}
            copied={copied}
            onCopy={() => void copyLink()}
          />
        </aside>
      </div>
    </>
  );
}
