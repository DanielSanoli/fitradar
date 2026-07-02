import type { LucideIcon } from "lucide-react";
import { Dumbbell, Salad, UtensilsCrossed } from "lucide-react";
import type { SpaceCategory, SpaceModule } from "@/lib/api/domain-types";
import { DEFAULT_SPACE_CATEGORY, normalizeSpaceCategory } from "@/lib/creator/space-categories";
import {
  defaultModulesForCategory,
  hasNutritionModule,
  hasTrainingModule,
  isHybridSpace,
  normalizeSpaceModules,
} from "@/lib/creator/space-modules";

export type SpaceVocabulary = {
  /** Program / plan icon — sidebar nav and program cards. */
  programIcon: LucideIcon;
  /** Workout / meal icon — item rows inside programs. */
  itemIcon: LucideIcon;
  program: { singular: string; plural: string };
  item: { singular: string; plural: string };
  /** Section header for item body (exercises / foods). */
  itemContent: string;
  itemContentSingular: string;
  itemContentPlural: string;
  checkInAction: string;
  checkInButton: string;
  checkInDoneToday: string;
  checkInRegistered: string;
  checkInSkipped: string;
  checkInSheetTitle: string;
  checkInSheetNotesPlaceholder: string;
  checkInSkipButton: string;
  checkInCelebration: string;
  itemOfDay: string;
  itemScheduled: string;
  mediaLabel: string;
  upcomingItems: string;
  programsNav: string;
  programsAndItems: string;
  myItems: string;
  newProgram: string;
  editProgram: string;
  newItem: string;
  editItem: string;
  addItem: string;
  addFirstItem: string;
  noProgram: string;
  noProgramYet: string;
  noItem: string;
  noItemYet: string;
  noItemPublished: string;
  itemList: string;
  viewItems: string;
  hideItems: string;
  viewItem: string;
  deleteItem: string;
  deleteItemConfirmTitle: string;
  deleteItemConfirmDescription: string;
  deleteItemConfirmLabel: string;
  itemDeleted: string;
  reorderItemsError: string;
  itemTitle: string;
  itemTitleLabel: string;
  itemDescriptionPlaceholder: string;
  backToProgram: string;
  paidPrograms: string;
  enrollToast: string;
  checkInHomeHint: string;
  noItemContent: string;
  noItemAvailable: string;
  itemNotFound: string;
  addItemDescription: string;
  removeContentConfirmTitle: string;
  removeContentConfirmDescription: string;
  addContentButton: string;
  noContentAdded: string;
  contentColumnHeader: string;
  contentNamePlaceholder: string;
  programsPageSubtitleEmpty: string;
  programsPageSubtitle: string;
  programsListEmptyDescription: string;
  programDetailEmptyHint: string;
  viewProgramsLink: string;
  freeProgramsHint: string;
  emptyContentPreview: string;
  itemLoadError: string;
  itemSaveError: string;
  defaultItemTitle: string;
  milestoneFirst: string;
  milestoneFive: string;
  milestoneTen: string;
  itemsRemaining: string;
  weekSummaryPrefix: string;
  checkInChartDone: string;
  /** How item body rows are serialized in contentMarkdown. */
  contentSchema: ItemContentSchema;
  /** Editable columns for each content row (after the name column). */
  contentFields: readonly ItemContentFieldDef[];
  itemTitlePlaceholder: string;
};

export type ItemContentSchema = "fitness" | "nutrition";

export type ItemContentFieldDef = {
  key: string;
  label: string;
  placeholder: string;
  /** Optional fixed width for the creator form grid (e.g. "70px"). */
  gridWidth?: string;
};

const FITNESS_VOCABULARY: SpaceVocabulary = {
  programIcon: Dumbbell,
  itemIcon: Dumbbell,
  program: { singular: "programa", plural: "programas" },
  item: { singular: "treino", plural: "treinos" },
  itemContent: "Exercícios",
  itemContentSingular: "exercício",
  itemContentPlural: "exercícios",
  checkInAction: "Marcar treino como feito",
  checkInButton: "Treino feito!",
  checkInDoneToday: "Treino concluído hoje",
  checkInRegistered: "Treino registrado!",
  checkInSkipped: "Treino marcado como pulado.",
  checkInSheetTitle: "Como foi o treino?",
  checkInSheetNotesPlaceholder: "Como foi o treino hoje?",
  checkInSkipButton: "Pulei o treino",
  checkInCelebration: "Treino feito!",
  itemOfDay: "Treino do dia",
  itemScheduled: "Treino programado",
  mediaLabel: "Execução do exercício",
  upcomingItems: "Próximos treinos",
  programsNav: "Programas",
  programsAndItems: "Programas & Treinos",
  myItems: "Meus treinos",
  newProgram: "Novo programa",
  editProgram: "Editar programa",
  newItem: "Novo treino",
  editItem: "Editar treino",
  addItem: "Adicionar treino",
  addFirstItem: "Adicionar primeiro treino",
  noProgram: "Nenhum programa ainda",
  noProgramYet: "Nenhum programa ainda",
  noItem: "Nenhum treino",
  noItemYet: "Nenhum treino ainda",
  noItemPublished: "Nenhum treino publicado neste programa ainda.",
  itemList: "Treinos",
  viewItems: "Ver treinos",
  hideItems: "Ocultar treinos",
  viewItem: "Ver treino",
  deleteItem: "Excluir treino",
  deleteItemConfirmTitle: "Excluir treino?",
  deleteItemConfirmDescription: "Este treino será removido permanentemente do programa.",
  deleteItemConfirmLabel: "Excluir treino",
  itemDeleted: "Treino excluído.",
  reorderItemsError: "Erro ao reordenar treinos.",
  itemTitle: "Treino",
  itemTitleLabel: "Título do treino",
  itemDescriptionPlaceholder: "Foco do treino, músculo alvo...",
  backToProgram: "Voltar para o programa",
  paidPrograms: "Programas pagos",
  enrollToast: "Matrícula confirmada! Seus treinos já estão na home.",
  checkInHomeHint:
    "Faça o check-in do treino do dia na aba Início.",
  noItemContent: "Seu criador ainda não publicou o conteúdo deste treino.",
  noItemAvailable: "Nenhum treino disponível para exibir neste estado.",
  itemNotFound: "Treino não encontrado ou você não está matriculado.",
  addItemDescription: "Dê um título, escreva uma descrição e adicione os exercícios.",
  removeContentConfirmTitle: "Remover exercício?",
  removeContentConfirmDescription: "será removido deste treino.",
  addContentButton: "Adicionar exercício",
  noContentAdded: 'Nenhum exercício adicionado. Clique em "Adicionar exercício" para começar.',
  contentColumnHeader: "Exercício",
  contentNamePlaceholder: "Nome do exercício",
  programsPageSubtitleEmpty: "Nenhum programa ainda — crie o primeiro",
  programsPageSubtitle: "programas · treinos",
  programsListEmptyDescription:
    "Estruture seus treinos, organize o conteúdo por dia e acompanhe a progressão dos alunos.",
  programDetailEmptyHint: "Adicione o primeiro treino para estruturar a semana dos seus alunos.",
  viewProgramsLink: "Ver programas disponíveis",
  freeProgramsHint:
    "Programas gratuitos podem ser matriculados na hora; pagos ficam disponíveis em breve.",
  emptyContentPreview: "Sem exercícios ainda.",
  itemLoadError: "Erro ao carregar treino.",
  itemSaveError: "Erro ao salvar treino.",
  defaultItemTitle: "Novo treino",
  milestoneFirst: "Primeiro treino",
  milestoneFive: "5 treinos feitos",
  milestoneTen: "10 treinos feitos",
  itemsRemaining: "treinos restantes",
  weekSummaryPrefix: "esta semana",
  checkInChartDone: "Treino feito",
  contentSchema: "fitness",
  contentFields: [
    { key: "sets", label: "Séries", placeholder: "3", gridWidth: "70px" },
    { key: "reps", label: "Repetições", placeholder: "10–12", gridWidth: "94px" },
    { key: "rest", label: "Descanso", placeholder: "60s", gridWidth: "74px" },
  ],
  itemTitlePlaceholder: "Ex.: Lower Body A",
};

const NUTRITION_VOCABULARY: SpaceVocabulary = {
  ...FITNESS_VOCABULARY,
  programIcon: Salad,
  itemIcon: UtensilsCrossed,
  program: { singular: "plano alimentar", plural: "planos alimentares" },
  item: { singular: "refeição", plural: "refeições" },
  itemContent: "Alimentos / Modo de preparo",
  itemContentSingular: "alimento",
  itemContentPlural: "alimentos",
  checkInAction: "Registrar refeição",
  checkInButton: "Registrar refeição",
  checkInDoneToday: "Refeição registrada hoje",
  checkInRegistered: "Refeição registrada!",
  checkInSkipped: "Refeição marcada como pulada.",
  checkInSheetTitle: "Como foi a refeição?",
  checkInSheetNotesPlaceholder: "Como foi a refeição hoje?",
  checkInSkipButton: "Pulei a refeição",
  checkInCelebration: "Refeição registrada!",
  itemOfDay: "Refeição do dia",
  itemScheduled: "Refeição programada",
  mediaLabel: "Preparo do prato",
  upcomingItems: "Próximas refeições",
  programsNav: "Planos alimentares",
  programsAndItems: "Planos alimentares & Refeições",
  myItems: "Minhas refeições",
  newProgram: "Novo plano alimentar",
  editProgram: "Editar plano alimentar",
  newItem: "Nova refeição",
  editItem: "Editar refeição",
  addItem: "Adicionar refeição",
  addFirstItem: "Adicionar primeira refeição",
  noProgram: "Nenhum plano alimentar ainda",
  noProgramYet: "Nenhum plano alimentar ainda",
  noItem: "Nenhuma refeição",
  noItemYet: "Nenhuma refeição ainda",
  noItemPublished: "Nenhuma refeição publicada neste plano ainda.",
  itemList: "Refeições",
  viewItems: "Ver refeições",
  hideItems: "Ocultar refeições",
  viewItem: "Ver refeição",
  deleteItem: "Excluir refeição",
  deleteItemConfirmTitle: "Excluir refeição?",
  deleteItemConfirmDescription: "Esta refeição será removida permanentemente do plano alimentar.",
  deleteItemConfirmLabel: "Excluir refeição",
  itemDeleted: "Refeição excluída.",
  reorderItemsError: "Erro ao reordenar refeições.",
  itemTitle: "Refeição",
  itemTitleLabel: "Título da refeição",
  itemDescriptionPlaceholder: "Foco da refeição, objetivo nutricional...",
  backToProgram: "Voltar para o plano alimentar",
  paidPrograms: "Planos pagos",
  enrollToast: "Matrícula confirmada! Suas refeições já estão na home.",
  checkInHomeHint:
    "Faça o check-in da refeição do dia na aba Início.",
  noItemContent: "Seu criador ainda não publicou o conteúdo desta refeição.",
  noItemAvailable: "Nenhuma refeição disponível para exibir neste estado.",
  itemNotFound: "Refeição não encontrada ou você não está matriculado.",
  addItemDescription: "Dê um título, escreva uma descrição e adicione os alimentos.",
  removeContentConfirmTitle: "Remover alimento?",
  removeContentConfirmDescription: "será removido desta refeição.",
  addContentButton: "Adicionar alimento",
  noContentAdded: 'Nenhum alimento adicionado. Clique em "Adicionar alimento" para começar.',
  contentColumnHeader: "Alimento",
  contentNamePlaceholder: "Nome do alimento",
  programsPageSubtitleEmpty: "Nenhum plano alimentar ainda — crie o primeiro",
  programsPageSubtitle: "planos alimentares · refeições",
  programsListEmptyDescription:
    "Estruture suas refeições, organize o conteúdo por dia e acompanhe a adesão dos alunos.",
  programDetailEmptyHint:
    "Adicione a primeira refeição para estruturar a semana dos seus alunos.",
  viewProgramsLink: "Ver planos alimentares disponíveis",
  freeProgramsHint:
    "Planos gratuitos podem ser matriculados na hora; pagos ficam disponíveis em breve.",
  emptyContentPreview: "Sem alimentos ainda.",
  itemLoadError: "Erro ao carregar refeição.",
  itemSaveError: "Erro ao salvar refeição.",
  defaultItemTitle: "Nova refeição",
  milestoneFirst: "Primeira refeição",
  milestoneFive: "5 refeições registradas",
  milestoneTen: "10 refeições registradas",
  itemsRemaining: "refeições restantes",
  weekSummaryPrefix: "esta semana",
  checkInChartDone: "Refeição registrada",
  contentSchema: "nutrition",
  contentFields: [
    { key: "quantity", label: "Quantidade / Porção", placeholder: "150g", gridWidth: "120px" },
    {
      key: "preparation",
      label: "Modo de preparo",
      placeholder: "Grelhado, sem óleo",
      gridWidth: "minmax(140px,1fr)",
    },
  ],
  itemTitlePlaceholder: "Ex.: Café da manhã",
};

const HYBRID_VOCABULARY: SpaceVocabulary = {
  ...FITNESS_VOCABULARY,
  programsNav: "Programas & Planos",
  programsAndItems: "Programas, Treinos & Nutrição",
  programsPageSubtitleEmpty: "Nenhum conteúdo ainda — crie o primeiro programa ou plano",
  programsListEmptyDescription:
    "Gerencie treinos e planos alimentares no mesmo espaço — ideal para quem acompanha treino e nutrição.",
  newProgram: "Novo programa / plano",
  editProgram: "Editar programa / plano",
};

const VOCABULARY_BY_CATEGORY: Partial<Record<SpaceCategory, SpaceVocabulary>> = {
  NUTRITION: NUTRITION_VOCABULARY,
};

export function getSpaceVocabulary(
  category?: SpaceCategory | string | null,
  modules?: SpaceModule[] | null,
): SpaceVocabulary {
  const normalizedModules = normalizeSpaceModules(
    modules ?? defaultModulesForCategory(category ?? DEFAULT_SPACE_CATEGORY),
  );
  if (isHybridSpace(normalizedModules)) {
    return HYBRID_VOCABULARY;
  }
  if (hasNutritionModule(normalizedModules) && !hasTrainingModule(normalizedModules)) {
    return NUTRITION_VOCABULARY;
  }
  const normalized = normalizeSpaceCategory(category ?? DEFAULT_SPACE_CATEGORY);
  return VOCABULARY_BY_CATEGORY[normalized] ?? FITNESS_VOCABULARY;
}

export function capitalizeLabel(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatCountLabel(
  count: number,
  singular: string,
  plural: string,
): string {
  const safe = Math.max(0, count);
  return safe === 1 ? `1 ${singular}` : `${safe} ${plural}`;
}

export function formatProgramItemSummary(
  programCount: number,
  itemCount: number,
  vocab: SpaceVocabulary,
): string {
  return `${formatCountLabel(programCount, vocab.program.singular, vocab.program.plural)} · ${formatCountLabel(itemCount, vocab.item.singular, vocab.item.plural)}`;
}

export function weekSummaryLabel(
  weeklyDone: number | null | undefined,
  vocab: SpaceVocabulary,
): string {
  if (weeklyDone == null || weeklyDone < 0) return "Sem dados esta semana";
  return `${formatCountLabel(weeklyDone, vocab.item.singular, vocab.item.plural)} ${vocab.weekSummaryPrefix}`;
}

export function getProgressMilestones(vocab: SpaceVocabulary) {
  return [
    {
      id: "first",
      title: vocab.milestoneFirst,
      sub: "O mais difícil já passou",
      thresh: 1,
      streak: false,
    },
    {
      id: "five",
      title: vocab.milestoneFive,
      sub: "Hábito começando a se formar",
      thresh: 5,
      streak: false,
    },
    {
      id: "week",
      title: "7 dias seguidos",
      sub: "Uma semana completa!",
      thresh: 7,
      streak: true,
    },
    {
      id: "ten",
      title: vocab.milestoneTen,
      sub: "Você está comprometido",
      thresh: 10,
      streak: false,
    },
  ] as const;
}

export function formatItemContentCount(count: number, vocab: SpaceVocabulary): string {
  return formatCountLabel(count, vocab.itemContentSingular, vocab.itemContentPlural);
}
