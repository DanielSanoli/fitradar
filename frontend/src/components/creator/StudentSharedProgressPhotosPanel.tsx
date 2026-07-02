import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProgressPhotoUrl } from "@/hooks/useProgressPhotoUrl";
import { progressPhotosApi } from "@/lib/api/progress-photos-api";
import type { ProgressPhotoResponse } from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";

function SharedPhotoCard({ photo, studentId }: { photo: ProgressPhotoResponse; studentId: string }) {
  const url = useProgressPhotoUrl(photo.id, { studentId });
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {url ? (
        <img src={url} alt="" className="aspect-[3/4] w-full object-cover" />
      ) : (
        <div className="flex aspect-[3/4] items-center justify-center bg-muted/30 text-xs text-muted-foreground">
          Carregando…
        </div>
      )}
      <div className="space-y-0.5 p-3">
        <p className="text-sm font-semibold">{photo.date}</p>
        {photo.weight ? <p className="text-xs text-muted-foreground">{photo.weight} kg</p> : null}
        {photo.note ? <p className="text-xs text-muted-foreground">{photo.note}</p> : null}
      </div>
    </div>
  );
}

export function StudentSharedProgressPhotosPanel({ studentId }: { studentId: string }) {
  const [photos, setPhotos] = useState<ProgressPhotoResponse[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    void progressPhotosApi.listSharedForStudent(studentId)
      .then(setPhotos)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Erro ao carregar fotos."));
  }, [studentId]);

  return (
    <section className="rounded-[18px] border border-border bg-card p-[18px] shadow-[0_6px_20px_rgba(0,0,0,0.28)]">
      <h2 className="text-sm font-bold">Evolução corporal (compartilhada)</h2>
      <Alert className="mt-3">
        <AlertDescription className="flex items-start gap-2 text-xs">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Somente fotos que o aluno optou por compartilhar. Dados sensíveis — use com responsabilidade
          e confidencialidade (LGPD).
        </AlertDescription>
      </Alert>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {photos.length === 0 && !error ? (
        <p className="mt-3 text-sm text-muted-foreground">
          O aluno ainda não compartilhou fotos de progresso.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <SharedPhotoCard key={photo.id} photo={photo} studentId={studentId} />
          ))}
        </div>
      )}
    </section>
  );
}
