import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { RadarMessage } from "@/components/radar/RadarChat";
import { useAuth } from "@/hooks/useAuth";
import { copilotApi } from "@/lib/api/copilot-api";
import { radarConfigForUser } from "@/lib/radar/copilot-config";
import { ApiError } from "@/lib/api/types";

type RadarCopilotContextValue = {
  open: boolean;
  openWidget: () => void;
  closeWidget: () => void;
  toggleWidget: () => void;
  messages: RadarMessage[];
  loading: boolean;
  ask: (question: string) => Promise<void>;
  greeting: string | undefined;
  suggestions: string[];
  title: string;
  subtitle: string;
  highlight: boolean;
  setHighlight: (on: boolean) => void;
  isStudentLayout: boolean;
};

const RadarCopilotContext = createContext<RadarCopilotContextValue | null>(null);

function buildGreetingMessage(text: string): RadarMessage {
  return { id: "greeting", role: "radar", text };
}

export function RadarCopilotProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const config = useMemo(() => radarConfigForUser(user), [user]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const [messages, setMessages] = useState<RadarMessage[]>([]);

  const greeting = user ? config.greeting(user.name) : undefined;

  useEffect(() => {
    if (greeting) {
      setMessages([buildGreetingMessage(greeting)]);
    } else {
      setMessages([]);
    }
  }, [greeting, user?.id]);

  const openWidget = useCallback(() => {
    setOpen(true);
    setHighlight(false);
  }, []);

  const closeWidget = useCallback(() => setOpen(false), []);

  const toggleWidget = useCallback(() => {
    setOpen((prev) => {
      if (prev) return false;
      setHighlight(false);
      return true;
    });
  }, []);

  const ask = useCallback(async (question: string) => {
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: question }]);
    setLoading(true);
    try {
      const res = await copilotApi.ask({ question });
      setMessages((prev) => [
        ...prev,
        {
          id: `r-${Date.now()}`,
          role: "radar",
          text: res.answer,
          showDisclaimer: true,
        },
      ]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Não consegui responder agora.";
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "radar",
          text: `Não consegui responder agora. Tente de novo em instantes.\n\n${msg}`,
          showDisclaimer: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<RadarCopilotContextValue>(
    () => ({
      open,
      openWidget,
      closeWidget,
      toggleWidget,
      messages,
      loading,
      ask,
      greeting,
      suggestions: config.suggestions,
      title: config.title,
      subtitle: config.subtitle,
      highlight,
      setHighlight,
      isStudentLayout: user?.role === "STUDENT",
    }),
    [
      open,
      openWidget,
      closeWidget,
      toggleWidget,
      messages,
      loading,
      ask,
      greeting,
      config,
      highlight,
      user?.role,
    ],
  );

  return <RadarCopilotContext.Provider value={value}>{children}</RadarCopilotContext.Provider>;
}

export function useRadarCopilot() {
  const ctx = useContext(RadarCopilotContext);
  if (!ctx) throw new Error("useRadarCopilot must be used within RadarCopilotProvider");
  return ctx;
}
