import type { CreatorSpaceResponse, SpaceCategory, SpaceModule } from "@/lib/api/domain-types";
import { defaultModulesForCategory } from "@/lib/creator/space-modules";

export function mockCreatorSpace(
  overrides: Partial<CreatorSpaceResponse> & { id: string; name: string },
): CreatorSpaceResponse {
  const category = (overrides.category ?? "OTHER") as SpaceCategory;
  const modules: SpaceModule[] =
    overrides.modules ?? defaultModulesForCategory(category);
  return {
    creatorId: "c1",
    slug: "espaco-teste",
    logoUrl: null,
    primaryColor: null,
    bio: null,
    createdAt: "2026-01-01",
    ...overrides,
    category,
    modules,
  };
}
