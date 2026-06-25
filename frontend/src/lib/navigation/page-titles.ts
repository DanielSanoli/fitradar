/** Títulos estáticos do topbar — rotas dinâmicas usam `usePageTitle`. */
export const STATIC_PAGE_TITLES: Record<string, string> = {
  "/app": "Painel do criador",
  "/app/retention": "Retenção",
  "/app/students": "Alunos",
  "/app/programs": "Programas & Treinos",
  "/app/programs/new": "Novo programa",
  "/app/marketplace": "Vendas & recebimento",
  "/app/space": "Construtor do Espaço",
  "/app/ranking": "Ranking",
  "/app/settings": "Configurações",
  "/student": "Meus treinos",
  "/student/programs": "Programas",
  "/student/progress": "Progresso",
  "/student/history": "Histórico",
  "/student/settings": "Perfil",
};

export function resolveStaticPageTitle(pathname: string): string | null {
  if (STATIC_PAGE_TITLES[pathname]) {
    return STATIC_PAGE_TITLES[pathname];
  }

  if (/^\/app\/programs\/[^/]+\/edit$/.test(pathname)) {
    return "Editar programa";
  }
  if (/^\/app\/programs\/[^/]+\/workouts\/new$/.test(pathname)) {
    return "Novo treino";
  }
  if (/^\/app\/programs\/[^/]+\/workouts\/[^/]+\/edit$/.test(pathname)) {
    return "Editar treino";
  }
  if (/^\/app\/students\/[^/]+$/.test(pathname)) {
    return "Aluno";
  }
  if (/^\/app\/programs\/[^/]+$/.test(pathname)) {
    return "Programa";
  }
  if (/^\/student\/workouts\/[^/]+$/.test(pathname)) {
    return "Treino";
  }

  return null;
}
