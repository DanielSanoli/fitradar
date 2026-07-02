import { useEffect } from "react";

export type PageMeta = {
  title: string;
  description: string;
  ogImage?: string;
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function usePageMeta({ title, description, ogImage = "/icons/icon.svg" }: PageMeta) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:image", ogImage.startsWith("http") ? ogImage : `${window.location.origin}${ogImage}`);

    return () => {
      document.title = previousTitle;
    };
  }, [title, description, ogImage]);
}
