import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getCatalog } from "@/services/tcgdex";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages = ["", "/pokedex", "/cards", "/teams", "/favorites", "/compare"].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" || p === "/cards" || p === "/pokedex" ? 1 : 0.5,
  }));
  const sets = await getCatalog()
    .then((series) =>
      series.flatMap((s) => s.sets).map((set) => ({
        url: `${SITE_URL}/cards/sets/${encodeURIComponent(set.id)}`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    )
    .catch(() => []);
  return [...pages, ...sets];
}
