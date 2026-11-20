import { NextRequest, NextResponse } from "next/server";

const API = "https://api.tcgdex.net/v2/pt-br";

export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const id = params.get("id");
  const resource = params.get("resource") ?? "cards";

  try {
    if (resource === "sets") {
      const response = await fetch(`${API}/sets`, { next: { revalidate: 86400 } });
      if (!response.ok) throw new Error("Falha ao consultar coleções");
      return NextResponse.json(await response.json());
    }

    if (id) {
      const response = await fetch(`${API}/cards/${encodeURIComponent(id)}`, { next: { revalidate: 86400 } });
      if (!response.ok) return NextResponse.json({ error: "Carta não encontrada" }, { status: response.status });
      return NextResponse.json(await response.json());
    }

    const query = new URLSearchParams();
    const search = params.get("q")?.trim();
    const set = params.get("set");
    const category = params.get("category");
    const page = Math.max(1, Number(params.get("page") ?? "1") || 1);

    if (search) query.set("name", search);
    if (set) query.set("set.id", `eq:${set}`);
    if (category && category !== "all") query.set("category", `eq:${category}`);
    query.set("pagination:page", String(page));
    query.set("pagination:itemsPerPage", "60");

    const response = await fetch(`${API}/cards?${query.toString()}`, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error("Falha ao consultar cartas");
    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar cartas" },
      { status: 502 },
    );
  }
}
