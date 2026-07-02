import { useEffect, useState } from "react";
import { onboardingApi } from "@/lib/api/onboarding-api";

export function useCreatorHasSpace() {
  const [hasSpace, setHasSpace] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void onboardingApi
      .status()
      .then((status) => {
        if (!cancelled) setHasSpace(status.hasSpace);
      })
      .catch(() => {
        if (!cancelled) setHasSpace(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    hasSpace,
    loading: hasSpace === null,
  };
}
