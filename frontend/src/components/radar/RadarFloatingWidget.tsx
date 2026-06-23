import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { RadarChat } from "@/components/radar/RadarChat";
import { useRadarCopilot } from "@/features/radar/RadarCopilotProvider";
import { cn } from "@/lib/utils";

type RadarFloatingWidgetProps = {
  visible?: boolean;
};

export function RadarFloatingWidget({ visible = true }: RadarFloatingWidgetProps) {
  const {
    open,
    openWidget,
    closeWidget,
    toggleWidget,
    messages,
    loading,
    ask,
    greeting,
    suggestions,
    title,
    subtitle,
    highlight,
    isStudentLayout,
  } = useRadarCopilot();

  if (!visible) return null;

  return (
    <>
      <button
        type="button"
        onClick={toggleWidget}
        aria-label={open ? "Fechar o Radar" : "Abrir o Radar"}
        aria-expanded={open}
        aria-controls="radar-chat-panel"
        className={cn(
          "fixed right-4 z-40 flex size-14 items-center justify-center rounded-full border border-primary/40 bg-primary text-primary-foreground shadow-[0_8px_28px_hsl(var(--primary)/0.35)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95 md:right-6",
          isStudentLayout ? "bottom-24 md:bottom-6" : "bottom-20 md:bottom-6",
        )}
      >
        <span
          className="size-4 rotate-45 rounded-[3px] bg-primary-foreground shadow-[0_0_10px_hsl(var(--primary-foreground)/0.5)]"
          aria-hidden
        />
        {highlight && !open ? (
          <span
            className="absolute right-1 top-1 size-3 rounded-full border-2 border-background bg-[hsl(var(--risk-high))]"
            aria-hidden
          />
        ) : null}
      </button>

      <Dialog open={open} onOpenChange={(next) => (next ? openWidget() : closeWidget())}>
        <DialogContent
          id="radar-chat-panel"
          aria-describedby={undefined}
          className={cn(
            "flex flex-col gap-0 overflow-hidden p-0",
            "fixed inset-x-2 top-auto w-auto max-w-none translate-x-0 translate-y-0 rounded-t-2xl border-border",
            "sm:inset-x-auto sm:right-6 sm:w-[min(100vw-2rem,420px)]",
            isStudentLayout
              ? "max-md:bottom-24 max-md:max-h-[min(calc(100dvh-6.5rem),640px)] md:bottom-6 md:max-h-[min(70vh,640px)]"
              : "bottom-0 max-h-[min(92vh,720px)] md:bottom-6 md:max-h-[min(70vh,640px)]",
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <div
            className={cn(
              "flex min-h-0 flex-col",
              isStudentLayout
                ? "max-md:h-[min(calc(100dvh-6.5rem),640px)] md:h-[min(70vh,640px)]"
                : "h-[min(92vh,720px)] md:h-[min(70vh,640px)]",
            )}
          >
            <RadarChat
              embedded
              title={title}
              subtitle={subtitle}
              greeting={greeting}
              suggestions={suggestions}
              messages={messages}
              onAsk={ask}
              loading={loading}
              className="h-full min-h-0 rounded-none border-0 shadow-none"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
