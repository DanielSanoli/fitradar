import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { memberApi } from "@/lib/api/member-api";
import type { CreatorSpaceResponse } from "@/lib/api/domain-types";
import {
  buildStudentThemeCssVars,
  normalizeAccentColor,
  type StudentThemeCssVars,
} from "@/lib/creator/space-theme";

type StudentSpaceContextValue = {
  space: CreatorSpaceResponse | null;
  isLoading: boolean;
  accent: string;
  themeVars: StudentThemeCssVars;
  themeStyle: CSSProperties;
};

const DEFAULT_THEME = buildStudentThemeCssVars(null);

const StudentSpaceContext = createContext<StudentSpaceContextValue | null>(null);

export function StudentSpaceProvider({ children }: { children: ReactNode }) {
  const [space, setSpace] = useState<CreatorSpaceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    void memberApi
      .mySpace()
      .then(setSpace)
      .catch(() => setSpace(null))
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo((): StudentSpaceContextValue => {
    const themeVars = buildStudentThemeCssVars(space?.primaryColor);
    const accent = normalizeAccentColor(space?.primaryColor);
    return {
      space,
      isLoading,
      accent,
      themeVars,
      themeStyle: themeVars as CSSProperties,
    };
  }, [space, isLoading]);

  return (
    <StudentSpaceContext.Provider value={value}>
      <div className="student-branded flex min-h-screen flex-col md:flex-row" style={value.themeStyle}>
        {children}
      </div>
    </StudentSpaceContext.Provider>
  );
}

export function useStudentSpace(): StudentSpaceContextValue {
  const ctx = useContext(StudentSpaceContext);
  if (!ctx) {
    return {
      space: null,
      isLoading: false,
      accent: normalizeAccentColor(null),
      themeVars: DEFAULT_THEME,
      themeStyle: DEFAULT_THEME as CSSProperties,
    };
  }
  return ctx;
}
