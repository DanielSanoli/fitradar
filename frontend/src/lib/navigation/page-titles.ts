import type { SpaceVocabulary } from "@/lib/space/vocabulary";
import { capitalizeLabel, getSpaceVocabulary } from "@/lib/space/vocabulary";

/** Títulos estáticos do topbar — rotas dinâmicas usam `usePageTitle`. */
export const STATIC_PAGE_TITLES: Record<string, string> = {
  "/app": "Painel do criador",
  "/app/retention": "Retenção",
  "/app/students": "Alunos",
  "/app/marketplace": "Vendas & recebimento",
  "/app/space": "Construtor do Espaço",
  "/app/ranking": "Ranking",
  "/app/settings": "Configurações",
  "/student": "Meus treinos",
  "/student/progress": "Progresso",
  "/student/history": "Histórico",
  "/student/settings": "Perfil",
};

export function resolvePageTitle(pathname: string, vocab: SpaceVocabulary): string | null {
  if (STATIC_PAGE_TITLES[pathname]) {
    if (pathname === "/student") return vocab.myItems;
    return STATIC_PAGE_TITLES[pathname];
  }

  if (pathname === "/app/programs") return vocab.programsAndItems;
  if (pathname === "/app/programs/new") return vocab.newProgram;
  if (pathname === "/student/programs") return vocab.programsNav;

  if (/^\/app\/programs\/[^/]+\/edit$/.test(pathname)) {
    return vocab.editProgram;
  }
  if (/^\/app\/programs\/[^/]+\/workouts\/new$/.test(pathname)) {
    return vocab.newItem;
  }
  if (/^\/app\/programs\/[^/]+\/workouts\/[^/]+\/edit$/.test(pathname)) {
    return vocab.editItem;
  }
  if (/^\/app\/students\/[^/]+$/.test(pathname)) {
    return "Aluno";
  }
  if (/^\/app\/programs\/[^/]+$/.test(pathname)) {
    return capitalizeLabel(vocab.program.singular);
  }
  if (/^\/student\/workouts\/[^/]+$/.test(pathname)) {
    return capitalizeLabel(vocab.item.singular);
  }

  return null;
}

/** @deprecated Use resolvePageTitle with vocabulary — kept for tests without provider. */
export function resolveStaticPageTitle(pathname: string): string | null {
  return resolvePageTitle(pathname, getSpaceVocabulary("GYM"));
}
