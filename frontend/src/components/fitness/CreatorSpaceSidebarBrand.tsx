import { useEffect, useState } from "react";
import { CreatorSpaceBrand } from "@/components/fitness/CreatorSpaceBrand";
import { spaceApi } from "@/lib/api/space-api";
import type { CreatorSpaceResponse } from "@/lib/api/domain-types";
import { cn } from "@/lib/utils";

type CreatorSpaceSidebarBrandProps = {
  className?: string;
};

/** Creator space name + area icon below the FitRadar logo in the sidebar. */
export function CreatorSpaceSidebarBrand({ className }: CreatorSpaceSidebarBrandProps) {
  const [space, setSpace] = useState<CreatorSpaceResponse | null>(null);

  useEffect(() => {
    void spaceApi
      .get()
      .then(setSpace)
      .catch(() => setSpace(null));
  }, []);

  if (!space?.name) return null;

  return (
    <div className={cn("px-3 pb-3", className)}>
      <CreatorSpaceBrand
        name={space.name}
        logoUrl={space.logoUrl}
        primaryColor={space.primaryColor}
        category={space.category}
        showAreaLabel
      />
    </div>
  );
}
