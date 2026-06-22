import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import { studentsApi } from "@/lib/api/students-api";
import type { StudentResponse } from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";

export function StudentsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    name: string;
    email: string;
    temporaryPassword: string;
  } | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const page = await studentsApi.list();
      setStudents(page.content);
      setState("content");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar alunos.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const r = await studentsApi.invite({ name: inviteName, email: inviteEmail });
      setInviteResult({
        name: r.name,
        email: r.email,
        temporaryPassword: r.temporaryPassword,
      });
      setShowInvite(false);
      setInviteName("");
      setInviteEmail("");
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Erro ao convidar.", "error");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Alunos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie convites, matrículas e acompanhe cada aluno.
          </p>
        </div>
        <Button onClick={() => setShowInvite(true)}>+ Convidar aluno</Button>
      </div>

      {inviteResult ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="space-y-2 pt-4 text-sm">
            <p className="font-semibold">Aluno convidado: {inviteResult.name}</p>
            <p>
              E-mail: <strong>{inviteResult.email}</strong>
            </p>
            <p>
              Senha temporária: <strong>{inviteResult.temporaryPassword}</strong>
            </p>
            <Button variant="outline" size="sm" onClick={() => setInviteResult(null)}>
              Fechar
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {showInvite ? (
        <Card>
          <CardContent className="pt-4">
            <form onSubmit={(e) => void invite(e)} className="flex flex-col gap-4">
              <h2 className="font-semibold">Convidar aluno</h2>
              <div className="space-y-2">
                <Label htmlFor="inv-name">Nome</Label>
                <Input
                  id="inv-name"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-email">E-mail</Label>
                <Input
                  id="inv-email"
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={inviting}>
                  {inviting ? "Enviando…" : "Convidar"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowInvite(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <PanelState
        state={
          state === "content" && students.length === 0
            ? "empty"
            : state === "content"
              ? "content"
              : state
        }
        message={
          state === "error"
            ? error
            : "Convide seu primeiro aluno para acompanhar aderência e risco de churn."
        }
        onRetry={load}
        icon="👥"
        title="Nenhum aluno ainda"
        actionLabel="+ Convidar aluno"
        onAction={() => setShowInvite(true)}
        rows={4}
      >
        <ul className="flex flex-col gap-2">
          {students.map((s) => (
            <li key={s.id}>
              <Link
                to={`/app/students/${s.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-secondary/60"
              >
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-muted-foreground">{s.email}</p>
                </div>
                <span className="text-sm text-primary">Ver detalhes →</span>
              </Link>
            </li>
          ))}
        </ul>
      </PanelState>
    </div>
  );
}
