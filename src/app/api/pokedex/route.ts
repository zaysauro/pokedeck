import { NextResponse } from "next/server";
import { getPokedexIndex } from "@/services/pokeapi";

/**
 * National Pokédex index (every species, one entry each).
 * Statically generated and revalidated daily, so new species published on
 * PokéAPI show up automatically without a redeploy.
 */
export const revalidate = 86400;

export async function GET() {
  const index = await getPokedexIndex();
  return NextResponse.json(index, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
