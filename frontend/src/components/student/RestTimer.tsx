import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Timer, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRESETS = [30, 60, 90] as const;
const SOUND_PREF_KEY = "fitradar-rest-timer-sound";

function readSoundEnabled(): boolean {
  try {
    return sessionStorage.getItem(SOUND_PREF_KEY) !== "off";
  } catch {
    return true;
  }
}

function playCompletionBeep(): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
    void ctx.close();
  } catch {
    // Web Audio indisponível
  }
}

function vibrateComplete(): void {
  try {
    navigator.vibrate?.([200, 100, 200]);
  } catch {
    // ignore
  }
}

export type RestTimerProps = {
  className?: string;
};

export function RestTimer({ className }: RestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [customSeconds, setCustomSeconds] = useState("");
  const [soundOn, setSoundOn] = useState(readSoundEnabled);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const onComplete = useCallback(() => {
    clearTimer();
    setRunning(false);
    setSecondsLeft(0);
    vibrateComplete();
    if (soundOn) playCompletionBeep();
  }, [clearTimer, soundOn]);

  useEffect(() => {
    if (!running || secondsLeft == null || secondsLeft <= 0) {
      clearTimer();
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev == null || prev <= 1) {
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [running, secondsLeft, clearTimer, onComplete]);

  const startPreset = (sec: number) => {
    clearTimer();
    setSecondsLeft(sec);
    setRunning(true);
  };

  const startCustom = () => {
    const sec = parseInt(customSeconds, 10);
    if (!Number.isFinite(sec) || sec < 1 || sec > 600) return;
    startPreset(sec);
  };

  const togglePause = () => {
    if (secondsLeft == null || secondsLeft <= 0) return;
    setRunning((r) => !r);
  };

  const toggleSound = () => {
    setSoundOn((on) => {
      const next = !on;
      try {
        sessionStorage.setItem(SOUND_PREF_KEY, next ? "on" : "off");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const active = secondsLeft != null && secondsLeft > 0;

  return (
    <div className={cn("rounded-2xl border border-border/80 bg-card/80 p-4", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Timer className="size-4 text-primary" aria-hidden />
          Descanso
        </span>
        <button
          type="button"
          onClick={toggleSound}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted/60"
          aria-label={soundOn ? "Desativar som ao terminar" : "Ativar som ao terminar"}
        >
          {soundOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        </button>
      </div>

      {active ? (
        <div className="mb-4 text-center">
          <p
            className="font-mono text-5xl font-extrabold tabular-nums tracking-tight text-primary"
            aria-live="polite"
            aria-atomic
          >
            {Math.floor(secondsLeft! / 60)}:{String(secondsLeft! % 60).padStart(2, "0")}
          </p>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="mt-3 h-12 min-w-[120px] rounded-xl"
            onClick={togglePause}
          >
            {running ? (
              <>
                <Pause className="size-5" aria-hidden />
                Pausar
              </>
            ) : (
              <>
                <Play className="size-5" aria-hidden />
                Retomar
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="mb-3 flex flex-wrap gap-2">
          {PRESETS.map((sec) => (
            <Button
              key={sec}
              type="button"
              variant="outline"
              size="lg"
              className="h-12 min-w-[72px] flex-1 rounded-xl text-base font-bold"
              onClick={() => startPreset(sec)}
            >
              {sec}s
            </Button>
          ))}
        </div>
      )}

      {!active ? (
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={600}
            inputMode="numeric"
            placeholder="Custom (s)"
            value={customSeconds}
            onChange={(e) => setCustomSeconds(e.target.value)}
            className="h-12 flex-1 rounded-xl border border-border bg-background px-3 text-base"
            aria-label="Segundos personalizados"
          />
          <Button
            type="button"
            size="lg"
            className="h-12 rounded-xl px-5 font-bold"
            onClick={startCustom}
            disabled={!customSeconds.trim()}
          >
            Ir
          </Button>
        </div>
      ) : null}
    </div>
  );
}
