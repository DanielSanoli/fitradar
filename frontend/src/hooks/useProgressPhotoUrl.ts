import { useEffect, useState } from "react";
import { progressPhotosApi } from "@/lib/api/progress-photos-api";

export function useProgressPhotoUrl(
  photoId: string | null,
  options?: { studentId?: string; enabled?: boolean },
) {
  const [url, setUrl] = useState<string | null>(null);
  const enabled = options?.enabled ?? true;
  const studentId = options?.studentId;

  useEffect(() => {
    if (!photoId || !enabled) {
      setUrl(null);
      return;
    }
    let active = true;
    let objectUrl: string | null = null;

    void (async () => {
      try {
        const blob = studentId
          ? await progressPhotosApi.fetchSharedContentBlob(studentId, photoId)
          : await progressPhotosApi.fetchContentBlob(photoId);
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch {
        if (active) setUrl(null);
      }
    })();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoId, studentId, enabled]);

  return url;
}
