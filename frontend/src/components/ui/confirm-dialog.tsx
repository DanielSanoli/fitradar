import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type PendingConfirm = ConfirmOptions & {
  resolve: (confirmed: boolean) => void;
};

export function useConfirmDialog() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [loading, setLoading] = useState(false);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const close = useCallback(
    (result: boolean) => {
      pending?.resolve(result);
      setPending(null);
      setLoading(false);
    },
    [pending],
  );

  const dialog = pending ? (
    <Dialog open onOpenChange={(open) => !open && close(false)}>
      <DialogContent aria-describedby="confirm-desc">
        <DialogHeader>
          <DialogTitle>{pending.title}</DialogTitle>
          <DialogDescription id="confirm-desc">{pending.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" disabled={loading} onClick={() => close(false)}>
            {pending.cancelLabel ?? "Cancelar"}
          </Button>
          <Button
            variant={pending.destructive ? "destructive" : "default"}
            disabled={loading}
            onClick={() => {
              setLoading(true);
              close(true);
            }}
          >
            {pending.confirmLabel ?? "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : null;

  return { confirm, dialog };
}
