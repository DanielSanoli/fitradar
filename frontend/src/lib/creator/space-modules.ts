import type { SpaceModule } from "@/lib/api/domain-types";

export const DEFAULT_SPACE_MODULES: SpaceModule[] = ["TRAINING"];

export function normalizeSpaceModules(modules?: SpaceModule[] | null): SpaceModule[] {
  if (!modules?.length) return [...DEFAULT_SPACE_MODULES];
  return [...new Set(modules)];
}

export function hasTrainingModule(modules: SpaceModule[]): boolean {
  return modules.includes("TRAINING");
}

export function hasNutritionModule(modules: SpaceModule[]): boolean {
  return modules.includes("NUTRITION");
}

export function isHybridSpace(modules: SpaceModule[]): boolean {
  return hasTrainingModule(modules) && hasNutritionModule(modules);
}

export function spaceModuleLabel(module: SpaceModule): string {
  return module === "TRAINING" ? "Treino" : "Nutrição";
}

export function spaceModulesSummary(modules: SpaceModule[]): string {
  const normalized = normalizeSpaceModules(modules);
  if (isHybridSpace(normalized)) return "Treino e Nutrição";
  if (hasNutritionModule(normalized)) return "Nutrição";
  return "Treino";
}

export function defaultModulesForCategory(category: string | null | undefined): SpaceModule[] {
  return category === "NUTRITION" ? ["NUTRITION"] : ["TRAINING"];
}
