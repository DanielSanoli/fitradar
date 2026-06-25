import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { updateProfile } from "@/lib/api/auth-api";
import { ApiError } from "@/lib/api/types";
import type { User } from "@/lib/api/types";

type ProfileEditFormProps = {
  user: User;
  onUpdated: (user: User) => void;
  className?: string;
};

export function ProfileEditForm({ user, onUpdated, className }: ProfileEditFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
  }, [user.name, user.email]);

  const dirty = name.trim() !== user.name || email.trim().toLowerCase() !== user.email.toLowerCase();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(undefined);
    try {
      const updated = await updateProfile({
        name: name.trim(),
        email: email.trim(),
      });
      onUpdated(updated);
      const emailChanged = updated.email.toLowerCase() !== user.email.toLowerCase();
      setMessage(
        emailChanged
          ? "Perfil atualizado — confirme o novo e-mail pelo link enviado."
          : "Perfil atualizado.",
      );
      toast(emailChanged ? "Verifique seu novo e-mail." : "Perfil salvo.");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Não foi possível salvar.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className={className}>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="profile-name">Nome</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="h-[42px] rounded-[11px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-email">E-mail</Label>
          <Input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-[42px] rounded-[11px]"
          />
        </div>
      </div>
      {message ? (
        <Alert className="mt-3" role="status">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" size="sm" className="mt-4" disabled={!dirty || saving}>
        {saving ? "Salvando…" : "Salvar perfil"}
      </Button>
    </form>
  );
}
