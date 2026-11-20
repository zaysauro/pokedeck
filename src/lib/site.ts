/** Canonical site origin (used for sitemap, robots and absolute Open Graph URLs). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://pokedeck-beta.vercel.app")
).replace(/\/$/, "");
