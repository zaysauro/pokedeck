"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, ArrowLeft, ArrowRight, RotateCw } from "lucide-react";
import { DEFAULT_TCG_FILTERS } from "@/lib/tcg/constants";
import { tcgFiltersToParams } from "@/lib/tcg/query";
import type { TcgCardBrief, TcgFilters, TcgMeta, TcgSearchResult } from "@/lib/tcg/types";
import { useTcgSearch } from "@/hooks/useTcgSearch";
import { EmptyState } from "@/components/ui/EmptyState";
import { TcgFilterBar } from "./TcgFilterBar";
import { TcgCardTile, TcgTileSkeleton } from "./TcgCardTile";
import { CardQuickView } from "./CardQuickView";

interface Props {
  initialFilters: TcgFilters;
  initialResult: TcgSearchResult | null;
  meta: TcgMeta | null;
  initialCardId?: string | null;
  /** lock some filters (e.g. a set page) and hide their controls from the URL */
  basePath?: string;
}

/** Search + combined filters + paginated grid of real cards. URL stays shareable. */
export function TcgExplorer({ initialFilters, initialResult, meta, initialCardId, basePath = "/cards" }: Props) {
  const [filters, setFilters] = useState<TcgFilters>(initialFilters);
  const { data, loading, error, retry } = useTcgSearch(filters, initialResult);
  const [quick, setQuick] = useState<TcgCardBrief | null>(
    initialCardId ? { id: initialCardId, localId: "", name: "Carta", image: null, setId: "", setName: null, serieId: null } : null,
  );
  const topRef = useRef<HTMLDivElement>(null);

  // Shareable URL (filters + opened card) without navigation.
  useEffect(() => {
    const p = tcgFiltersToParams(filters);
    if (quick) p.set("card", quick.id);
    const qs = p.toString();
    const url = `${basePath}${qs ? `?${qs}` : ""}`;
    if (url !== window.location.pathname + window.location.search) window.history.replaceState(null, "", url);
  }, [filters, quick, basePath]);

  const update = (patch: Partial<TcgFilters>) => setFilters((f) => ({ ...f, ...patch, page: "page" in patch ? patch.page ?? 1 : 1 }));
  const goPage = (page: number) => {
    update({ page });
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const close = useCallback(() => setQuick(null), []);

  const cards = data?.cards ?? [];
  const showSkeleton = loading && !data;

  return (
    <div className="space-y-6">
      <div ref={topRef} className="sticky top-[76px] z-30 -mx-4 scroll-mt-24 border-b border-white/5 bg-ink/90 px-4 pb-3 pt-2 backdrop-blur-xl md:-mx-6 md:px-6">
        <TcgFilterBar value={filters} onChange={update} onReset={() => setFilters({ ...DEFAULT_TCG_FILTERS, sort: filters.sort })} meta={meta} total={data?.total ?? null} loading={loading} />
      </div>

      {error ? (
        <EmptyState
          title="Não foi possível carregar as cartas"
          body={error}
          action={<button type="button" onClick={retry} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-ink"><RotateCw size={14} /> Tentar novamente</button>}
        />
      ) : showSkeleton ? (
        <Grid>{Array.from({ length: 12 }, (_, i) => <TcgTileSkeleton key={i} />)}</Grid>
      ) : cards.length === 0 && !loading ? (
        <EmptyState title="Nenhuma carta encontrada" body="Tente outro nome, remova filtros ou inclua cartas sem imagem." />
      ) : (
        <>
          {!meta && (
            <p className="flex items-center gap-2 text-xs text-amber-200/80"><AlertTriangle size={13} /> Opções de filtro indisponíveis no momento.</p>
          )}
          <div className={`transition-opacity duration-300 ${loading ? "opacity-50" : "opacity-100"}`}>
            <Grid>
              {cards.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: Math.min(i, 12) * 0.03, ease: [0.16, 1, 0.3, 1] }}
                >
                  <TcgCardTile card={c} rarity={filters.rarity || null} onOpen={setQuick} priority={i < 6} />
                </motion.div>
              ))}
            </Grid>
          </div>
          {data && data.pages > 1 && <Pagination page={data.page} pages={data.pages} onPage={goPage} disabled={loading} />}
        </>
      )}

      <CardQuickView card={quick} onClose={close} />
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{children}</div>;
}

function Pagination({ page, pages, onPage, disabled }: { page: number; pages: number; onPage: (p: number) => void; disabled: boolean }) {
  const around = [1, page - 1, page, page + 1, pages].filter((p, i, a) => p >= 1 && p <= pages && a.indexOf(p) === i).sort((a, b) => a - b);
  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-center gap-2 pt-6">
      <button type="button" disabled={page <= 1 || disabled} onClick={() => onPage(page - 1)} className="flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs text-white/70 transition hover:bg-white/5 disabled:opacity-30">
        <ArrowLeft size={14} /> Anterior
      </button>
      {around.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - around[i - 1] > 1 && <span className="text-white/25">…</span>}
          <button
            type="button"
            disabled={disabled}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onPage(p)}
            className={`h-10 min-w-10 rounded-full px-3 font-mono text-xs transition ${p === page ? "bg-white text-ink" : "border border-white/10 text-white/60 hover:text-white"}`}
          >
            {p}
          </button>
        </span>
      ))}
      <button type="button" disabled={page >= pages || disabled} onClick={() => onPage(page + 1)} className="flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs text-white/70 transition hover:bg-white/5 disabled:opacity-30">
        Próxima <ArrowRight size={14} />
      </button>
    </nav>
  );
}
