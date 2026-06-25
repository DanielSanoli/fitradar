import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { resolvePageTitle } from "@/lib/navigation/page-titles";
import { useSpaceVocabulary } from "@/hooks/useSpaceVocabulary";

type PageTitleContextValue = {
  override: string | null;
  setOverride: (title: string | null) => void;
};

const PageTitleContext = createContext<PageTitleContextValue | null>(null);

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [override, setOverride] = useState<string | null>(null);
  const value = useMemo(() => ({ override, setOverride }), [override]);

  return <PageTitleContext.Provider value={value}>{children}</PageTitleContext.Provider>;
}

/** Define o título do topbar enquanto a página estiver montada. */
export function usePageTitle(title: string | null | undefined) {
  const ctx = useContext(PageTitleContext);
  const setOverride = ctx?.setOverride;

  useEffect(() => {
    if (!setOverride) return;
    if (!title?.trim()) {
      setOverride(null);
      return;
    }
    setOverride(title.trim());
    return () => setOverride(null);
  }, [title, setOverride]);
}

export function useResolvedPageTitle(): string {
  const { pathname } = useLocation();
  const ctx = useContext(PageTitleContext);
  const { vocabulary } = useSpaceVocabulary();

  if (ctx?.override) {
    return ctx.override;
  }

  return resolvePageTitle(pathname, vocabulary) ?? "FitRadar";
}
