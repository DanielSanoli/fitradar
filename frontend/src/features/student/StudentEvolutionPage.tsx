import { useCallback, useEffect, useState } from "react";
import { Camera, ChevronLeft, Lock, Share2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ProgressPhotoCompareSlider } from "@/components/student/ProgressPhotoCompareSlider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import { useProgressPhotoUrl } from "@/hooks/useProgressPhotoUrl";
import { progressPhotosApi } from "@/lib/api/progress-photos-api";
import type { ProgressPhotoResponse } from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";
import { localDateKey } from "@/lib/student/date-utils";
import { cn } from "@/lib/utils";

function PhotoThumb({
  photo,
  selected,
  onSelect,
}: {
  photo: ProgressPhotoResponse;
  selected: boolean;
  onSelect: () => void;
}) {
  const url = useProgressPhotoUrl(photo.id);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "overflow-hidden rounded-xl border text-left transition-colors",
        selected ? "border-primary ring-2 ring-primary/40" : "border-border",
      )}
    >
      {url ? (
        <img src={url} alt="" className="aspect-[3/4] w-full object-cover" />
      ) : (
        <div className="flex aspect-[3/4] w-full items-center justify-center bg-muted/40 text-xs text-muted-foreground">
          Carregando…
        </div>
      )}
      <div className="space-y-0.5 p-2.5">
        <p className="text-xs font-semibold">{photo.date}</p>
        {photo.weight ? <p className="text-[11px] text-muted-foreground">{photo.weight} kg</p> : null}
      </div>
    </button>
  );
}

export function StudentEvolutionPage() {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<ProgressPhotoResponse[]>([]);
  const [consented, setConsented] = useState<boolean | null>(null);
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [date, setDate] = useState(localDateKey());
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [compareIds, setCompareIds] = useState<[string | null, string | null]>([null, null]);

  const load = useCallback(async () => {
    setState("loading");
    setError(undefined);
    try {
      const [consent, list] = await Promise.all([
        progressPhotosApi.consentStatus(),
        progressPhotosApi.listMine(),
      ]);
      setConsented(consent.consented);
      setPhotos(list);
      if (list.length >= 2) {
        setCompareIds([list[0].id, list[list.length - 1].id]);
      }
      setState("content");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar evolução.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const beforeUrl = useProgressPhotoUrl(compareIds[0]);
  const afterUrl = useProgressPhotoUrl(compareIds[1]);

  const toggleCompare = (id: string) => {
    setCompareIds(([a, b]) => {
      if (a === id) return [b, b];
      if (b === id) return [a, a];
      if (!a) return [id, b];
      if (!b) return [a, id];
      return [a, id];
    });
  };

  const grantConsent = async () => {
    try {
      await progressPhotosApi.grantConsent();
      setConsented(true);
      toast("Consentimento registrado.");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro ao registrar consentimento.", "error");
    }
  };

  const upload = async () => {
    if (!file) {
      toast("Selecione uma foto.", "error");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("date", date);
      if (weight.trim()) form.append("weight", weight.trim());
      if (note.trim()) form.append("note", note.trim());
      await progressPhotosApi.upload(form);
      setFile(null);
      setNote("");
      setWeight("");
      toast("Foto adicionada.");
      await load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro no upload.", "error");
    } finally {
      setUploading(false);
    }
  };

  const toggleShare = async (photo: ProgressPhotoResponse) => {
    try {
      const updated = await progressPhotosApi.updateSharing(photo.id, !photo.sharedWithCoach);
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? updated : p)));
      toast(updated.sharedWithCoach ? "Compartilhada com o coach." : "Foto privada novamente.");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro ao atualizar compartilhamento.", "error");
    }
  };

  const remove = async (id: string) => {
    try {
      await progressPhotosApi.delete(id);
      toast("Foto removida.");
      await load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro ao remover.", "error");
    }
  };

  const compareReady = Boolean(beforeUrl && afterUrl && compareIds[0] && compareIds[1]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 pb-28 md:pb-8">
      <header className="flex items-center gap-3 px-1 pt-1">
        <Button variant="outline" size="sm" asChild className="h-9 rounded-[9px]">
          <Link to="/student/progress">
            <ChevronLeft className="size-4" aria-hidden />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight">Minha evolução</h1>
          <p className="text-xs text-muted-foreground">Fotos privadas — você decide o que compartilhar.</p>
        </div>
      </header>

      <PanelState state={state} message={error} onRetry={load} emptyVariant="student">
        {consented === false ? (
          <Alert>
            <AlertDescription className="space-y-3">
              <p>
                Fotos corporais são dados sensíveis (LGPD). Precisamos do seu consentimento explícito antes
                do primeiro upload.
              </p>
              <Button onClick={() => void grantConsent()}>Consentir e continuar</Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {consented ? (
          <>
            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
                <Camera className="size-4 text-primary" aria-hidden />
                Nova foto
              </h2>
              <div className="grid gap-3">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <input type="text" inputMode="decimal" placeholder="Peso (kg, opcional)" value={weight} onChange={(e) => setWeight(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <textarea placeholder="Nota (opcional)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
                <Button loading={uploading} onClick={() => void upload()} className="rounded-[12px] font-bold">
                  Enviar foto
                </Button>
              </div>
            </section>

            {photos.length >= 2 && compareReady ? (
              <section className="space-y-2">
                <h2 className="text-sm font-bold">Comparador</h2>
                <p className="text-xs text-muted-foreground">Selecione duas fotos na timeline ou use a primeira e a última.</p>
                <ProgressPhotoCompareSlider beforeSrc={beforeUrl!} afterSrc={afterUrl!} />
              </section>
            ) : null}

            <section className="space-y-3">
              <h2 className="text-sm font-bold">Timeline</h2>
              {photos.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhuma foto ainda. Envie a primeira para acompanhar sua evolução.
                </p>
              ) : (
                <div className="space-y-4 border-l-2 border-primary/30 pl-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="space-y-2">
                      <PhotoThumb photo={photo} selected={compareIds.includes(photo.id)} onSelect={() => toggleCompare(photo.id)} />
                      {photo.note ? <p className="text-sm text-muted-foreground">{photo.note}</p> : null}
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => void toggleShare(photo)} className="gap-1.5">
                          {photo.sharedWithCoach ? <Share2 className="size-3.5" /> : <Lock className="size-3.5" />}
                          {photo.sharedWithCoach ? "Compartilhada" : "Privada"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => void remove(photo.id)} className="gap-1.5 text-destructive">
                          <Trash2 className="size-3.5" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <p className="text-center text-[11px] text-muted-foreground">
              Sugestão, não orientação médica/profissional.
            </p>
          </>
        ) : null}
      </PanelState>
    </div>
  );
}
