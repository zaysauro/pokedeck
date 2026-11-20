"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Search, X, Layers3 } from "lucide-react";
import { Container, PageHeader } from "@/components/ui/PageHeader";

type CardBrief = { id: string; localId: string; name: string; image?: string; category?: string; rarity?: string; set?: { id: string; name: string } };
type CardDetail = CardBrief & { hp?: number; types?: string[]; illustrator?: string; description?: string; attacks?: { name: string; damage?: string; effect?: string }[]; abilities?: { name: string; effect?: string }[]; retreat?: number; weaknesses?: { type: string; value?: string }[]; effect?: string; trainerType?: string; variants?: Record<string, boolean> };
type SetItem = { id: string; name: string; logo?: string; cardCount?: { total?: number; official?: number } };

const imageUrl = (image?: string, size: "low" | "high" = "low") => image ? `${image}/${size}.webp` : "";

export function TcgExplorer() {
  const [cards, setCards] = useState<CardBrief[]>([]);
  const [sets, setSets] = useState<SetItem[]>([]);
  const [query, setQuery] = useState("");
  const [setId, setSetId] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<CardDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetch("/api/tcg?resource=sets").then(r => r.ok ? r.json() : []).then(data => setSets(Array.isArray(data) ? data : [])).catch(() => setSets([]));
  }, []);

  const loadCards = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (query.trim()) params.set("q", query.trim());
      if (setId) params.set("set", setId);
      if (category !== "all") params.set("category", category);
      const response = await fetch(`/api/tcg?${params}`, { signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível carregar as cartas.");
      setCards(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") setError(err.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, query, setId, category]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => loadCards(controller.signal), query ? 350 : 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [loadCards, query]);

  const openCard = async (card: CardBrief) => {
    setSelected(card as CardDetail);
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/tcg?id=${encodeURIComponent(card.id)}`);
      if (response.ok) setSelected(await response.json());
    } finally { setDetailLoading(false); }
  };

  const title = useMemo(() => setId ? sets.find(s => s.id === setId)?.name ?? "Coleção" : "Todas as coleções", [setId, sets]);

  return (
    <Container>
      <PageHeader eyebrow="Pokémon Trading Card Game · TCGdex" title="Cartas" italic="reais">
        Explore cartas oficiais do Pokémon Estampas Ilustradas: de coleções clássicas às expansões mais recentes.
        Consulte ilustrações, raridades, ataques, artistas e detalhes de cada carta.
      </PageHeader>

      <section className="pb-10">
        <div className="mb-7 rounded-2xl border border-white/10 bg-white/[0.025] p-3 md:p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="flex h-12 flex-1 items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-4">
              <Search size={17} className="text-white/35" />
              <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="Buscar por nome da carta ou Pokémon..." className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30" />
              {query && <button onClick={() => setQuery("")} aria-label="Limpar busca"><X size={15} className="text-white/40" /></button>}
            </label>
            <select value={setId} onChange={e => { setSetId(e.target.value); setPage(1); }} className="h-12 rounded-xl border border-white/10 bg-[#151518] px-4 text-sm text-white/80 outline-none lg:w-64">
              <option value="">Todas as coleções</option>
              {sets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="h-12 rounded-xl border border-white/10 bg-[#151518] px-4 text-sm text-white/80 outline-none lg:w-48">
              <option value="all">Todas as categorias</option><option value="Pokemon">Pokémon</option><option value="Trainer">Treinador</option><option value="Energy">Energia</option>
            </select>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-white/35">
            <span className="flex items-center gap-2"><Layers3 size={13} /> {title} <span className="text-white/15">/</span> Página {page}</span>
            <span>Dados e imagens fornecidos pela TCGdex</span>
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-8 text-center text-sm text-red-200">{error}<button onClick={() => loadCards()} className="ml-3 underline">Tentar novamente</button></div> : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {loading ? Array.from({length:18},(_,i)=><div key={i} className="aspect-[3/4.15] animate-pulse rounded-xl bg-white/[0.05]" />) :
              cards.map(card => <button key={card.id} onClick={() => openCard(card)} className="group text-left">
                <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] transition duration-300 group-hover:-translate-y-1 group-hover:border-[var(--accent)]/50 group-hover:shadow-[0_18px_50px_rgba(0,0,0,.45)]">
                  {card.image ? <img src={imageUrl(card.image)} alt={card.name} loading="lazy" className="block aspect-[3/4.15] w-full object-contain" /> : <div className="grid aspect-[3/4.15] place-items-center text-white/25"><BookOpen /></div>}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-3 pb-3 pt-12">
                    <p className="truncate text-xs font-medium text-white">{card.name}</p>
                    <p className="mt-1 truncate text-[10px] text-white/45">{card.set?.name ?? card.id}</p>
                  </div>
                </div>
              </button>)}
          </div>
        )}
        {!loading && !error && cards.length === 0 && <div className="py-20 text-center text-sm text-white/40">Nenhuma carta encontrada com esses filtros.</div>}
        <div className="mt-9 flex items-center justify-center gap-4">
          <button disabled={page <= 1 || loading} onClick={() => { setPage(p => Math.max(1,p-1)); window.scrollTo({top:0,behavior:"smooth"}); }} className="flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs text-white/65 transition hover:bg-white/5 disabled:opacity-25"><ArrowLeft size={14}/> Anterior</button>
          <span className="font-mono text-xs text-white/35">{String(page).padStart(2,"0")}</span>
          <button disabled={cards.length < 60 || loading} onClick={() => { setPage(p => p+1); window.scrollTo({top:0,behavior:"smooth"}); }} className="flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs text-white/65 transition hover:bg-white/5 disabled:opacity-25">Próxima <ArrowRight size={14}/></button>
        </div>
      </section>

      {selected && <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md" onClick={() => setSelected(null)}>
        <div onClick={e => e.stopPropagation()} className="relative my-auto grid w-full max-w-3xl gap-6 rounded-3xl border border-white/10 bg-[#111114] p-5 shadow-2xl md:grid-cols-[minmax(220px, .8fr)_1.2fr] md:p-7">
          <button onClick={() => setSelected(null)} aria-label="Fechar" className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/40 text-white/70"><X size={17}/></button>
          <div className="mx-auto w-full max-w-[280px]">
            {selected.image && <img src={imageUrl(selected.image,"high")} alt={selected.name} className="w-full rounded-xl shadow-[0_20px_60px_rgba(0,0,0,.6)]" />}
          </div>
          <div className="py-2">
            <p className="eyebrow">Pokémon TCG · {selected.id}</p>
            <h2 className="display mt-3 pr-8 text-4xl text-white md:text-5xl">{selected.name}</h2>
            <p className="mt-2 text-xs text-white/45">{selected.set?.name} · {selected.localId}{selected.rarity ? ` · ${selected.rarity}` : ""}</p>
            {detailLoading ? <div className="mt-8 h-24 animate-pulse rounded-xl bg-white/5"/> : <div className="mt-7 space-y-5 text-sm">
              <div className="flex flex-wrap gap-2">{selected.category && <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/65">{selected.category === "Pokemon" ? "Pokémon" : selected.category === "Trainer" ? "Treinador" : "Energia"}</span>}{selected.hp && <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/65">{selected.hp} PS</span>}{selected.types?.map(t=><span key={t} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/75">{t}</span>)}</div>
              {selected.description && <p className="leading-relaxed text-white/65">{selected.description}</p>}
              {selected.abilities?.map(a=><div key={a.name}><p className="text-xs font-semibold text-[var(--accent)]">Habilidade · {a.name}</p><p className="mt-1 leading-relaxed text-white/60">{a.effect}</p></div>)}
              {selected.attacks?.map(a=><div key={a.name} className="border-t border-white/10 pt-3"><div className="flex justify-between gap-3"><p className="font-medium text-white">{a.name}</p><p className="font-mono text-[var(--accent)]">{a.damage}</p></div><p className="mt-1 leading-relaxed text-white/55">{a.effect}</p></div>)}
              {selected.effect && <p className="leading-relaxed text-white/65">{selected.effect}</p>}
              {selected.illustrator && <p className="border-t border-white/10 pt-3 text-xs text-white/35">Ilustração: {selected.illustrator}</p>}
              <p className="text-[10px] leading-relaxed text-white/25">Dados da TCGdex. Pokémon e suas marcas pertencem aos respectivos titulares.</p>
            </div>}
          </div>
        </div>
      </div>}
    </Container>
  );
}
