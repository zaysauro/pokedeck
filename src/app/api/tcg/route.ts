import { NextRequest, NextResponse } from "next/server";
import { parseTcgFilters } from "@/lib/tcg/query";
import { getCard, getCardsByIds, getMeta, searchCards } from "@/services/tcgdex";

/**
 * TCGdex proxy used by the client explorer.
 *   /api/tcg?q=&serie=&set=&category=&rarity=&type=&illustrator=&stage=&hpMin=&hpMax=&sort=&page=&images=
 *   /api/tcg?id=sv03.5-199            → full card
 *   /api/tcg?ids=a,b,c                → several full cards (max 60)
 *   /api/tcg?resource=meta | sets     → filter options / catalog
 */
const CACHE = { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" };

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  try {
    const resource = params.get("resource");
    if (resource === "meta") return NextResponse.json(await getMeta(), { headers: CACHE });
    if (resource === "sets") {
      const meta = await getMeta();
      return NextResponse.json(meta.series.flatMap((s) => s.sets), { headers: CACHE });
    }

    const id = params.get("id");
    if (id) {
      const card = await getCard(id);
      if (!card) return NextResponse.json({ error: "Carta não encontrada" }, { status: 404 });
      return NextResponse.json(card, { headers: CACHE });
    }

    const ids = params.get("ids");
    if (ids !== null) {
      const list = ids.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 60);
      return NextResponse.json(await getCardsByIds(list), { headers: CACHE });
    }

    const size = Number(params.get("pageSize"));
    const pageSize = Number.isFinite(size) && size >= 6 && size <= 60 ? Math.round(size) : undefined;
    return NextResponse.json(await searchCards(parseTcgFilters(params), pageSize), { headers: CACHE });
  } catch (error) {
    console.error("[api/tcg]", error);
    return NextResponse.json(
      { error: "A base de cartas (TCGdex) não respondeu. Tente novamente em instantes." },
      { status: 502 },
    );
  }
}
