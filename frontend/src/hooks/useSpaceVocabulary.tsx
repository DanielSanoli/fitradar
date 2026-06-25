import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { memberApi } from "@/lib/api/member-api";
import { spaceApi } from "@/lib/api/space-api";
import type { SpaceCategory } from "@/lib/api/domain-types";
import { DEFAULT_SPACE_CATEGORY, normalizeSpaceCategory } from "@/lib/creator/space-categories";
import {
  getSpaceVocabulary,
  type SpaceVocabulary,
} from "@/lib/space/vocabulary";

type SpaceVocabularyContextValue = {
  category: SpaceCategory;
  vocabulary: SpaceVocabulary;
};

const SpaceVocabularyContext = createContext<SpaceVocabularyContextValue | null>(null);

export function SpaceVocabularyProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [category, setCategory] = useState<SpaceCategory>(DEFAULT_SPACE_CATEGORY);

  useEffect(() => {
    if (!isAuthenticated) {
      setCategory(DEFAULT_SPACE_CATEGORY);
      return;
    }

    const isStudentArea = pathname.startsWith("/student");
    const loadCategory = isStudentArea
      ? memberApi.mySpace().then((space) => space?.category ?? null)
      : pathname.startsWith("/app")
        ? spaceApi.get().then((space) => space?.category ?? null).catch(() => null)
        : Promise.resolve(null);

    void loadCategory.then((value) => {
      setCategory(normalizeSpaceCategory(value ?? DEFAULT_SPACE_CATEGORY));
    });
  }, [isAuthenticated, pathname, user?.role]);

  const value = useMemo(
    () => ({
      category,
      vocabulary: getSpaceVocabulary(category),
    }),
    [category],
  );

  return (
    <SpaceVocabularyContext.Provider value={value}>{children}</SpaceVocabularyContext.Provider>
  );
}

export function useSpaceVocabulary(): SpaceVocabularyContextValue {
  const ctx = useContext(SpaceVocabularyContext);
  if (!ctx) {
    return {
      category: DEFAULT_SPACE_CATEGORY,
      vocabulary: getSpaceVocabulary(DEFAULT_SPACE_CATEGORY),
    };
  }
  return ctx;
}
