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
import type { SpaceCategory, SpaceModule } from "@/lib/api/domain-types";
import { DEFAULT_SPACE_CATEGORY, normalizeSpaceCategory } from "@/lib/creator/space-categories";
import {
  defaultModulesForCategory,
  hasNutritionModule,
  hasTrainingModule,
  normalizeSpaceModules,
} from "@/lib/creator/space-modules";
import {
  getSpaceVocabulary,
  type SpaceVocabulary,
} from "@/lib/space/vocabulary";

type SpaceVocabularyContextValue = {
  category: SpaceCategory;
  modules: SpaceModule[];
  hasTraining: boolean;
  hasNutrition: boolean;
  vocabulary: SpaceVocabulary;
};

const SpaceVocabularyContext = createContext<SpaceVocabularyContextValue | null>(null);

function applySpace(category: SpaceCategory | null, modules: SpaceModule[] | null) {
  const normalizedCategory = normalizeSpaceCategory(category ?? DEFAULT_SPACE_CATEGORY);
  const normalizedModules = normalizeSpaceModules(
    modules ?? defaultModulesForCategory(normalizedCategory),
  );
  return {
    category: normalizedCategory,
    modules: normalizedModules,
    hasTraining: hasTrainingModule(normalizedModules),
    hasNutrition: hasNutritionModule(normalizedModules),
    vocabulary: getSpaceVocabulary(normalizedCategory, normalizedModules),
  };
}

export function SpaceVocabularyProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [state, setState] = useState(() => applySpace(null, null));

  useEffect(() => {
    if (!isAuthenticated) {
      setState(applySpace(null, null));
      return;
    }

    const isStudentArea = pathname.startsWith("/student");
    const loadSpace = isStudentArea
      ? memberApi.mySpace().then((space) =>
          space
            ? { category: space.category, modules: space.modules }
            : { category: null, modules: null },
        )
      : pathname.startsWith("/app")
        ? spaceApi
            .get()
            .then((space) => ({ category: space.category, modules: space.modules }))
            .catch(() => ({ category: null, modules: null }))
        : Promise.resolve({ category: null, modules: null });

    void loadSpace.then(({ category, modules }) => {
      setState(applySpace(category, modules));
    });
  }, [isAuthenticated, pathname, user?.role]);

  const value = useMemo(() => state, [state]);

  return (
    <SpaceVocabularyContext.Provider value={value}>{children}</SpaceVocabularyContext.Provider>
  );
}

export function useSpaceVocabulary(): SpaceVocabularyContextValue {
  const ctx = useContext(SpaceVocabularyContext);
  if (!ctx) {
    return applySpace(DEFAULT_SPACE_CATEGORY, defaultModulesForCategory(DEFAULT_SPACE_CATEGORY));
  }
  return ctx;
}
