"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { usePokedex } from "@/hooks/usePokedex";
import { applyFilters, filtersToQuery, type Filters } from "@/lib/filters";
import { FilterBar } from "./FilterBar";
import { GridSkeleton, VirtualGrid } from "./VirtualGrid";
import { EmptyState } from "@/components/ui/EmptyState";

export function PokedexExplorer({ initial }: { initial: Filters }) {
  const { entries, loading, error, retry, degraded } = usePokedex();
  const [filters, setFilters] = useState(initial);
  const deferred = useDeferredValue(filters);
  const results = useMemo(() => applyFilters(entries, deferred), [entries, deferred]);

  // keep the URL shareable without triggering navigation
  useEffect(() => {
    const qs = filtersToQuery(filters);
    const url = `${window.location.pathname}${qs}`;
    if (url !== window.location.pathname + window.location.search) window.history.replaceState(null, "", url);
  }, [filters]);

  return (
    <div className="space-y-6">
      <div className="sticky top-[76px] z-30 -mx-4 bg-gradient-to-b from-ink via-ink/95 to-ink/0 px-4 pb-4 pt-2 md:-mx-6 md:px-6">
        <FilterBar value={filters} onChange={setFilters} count={results.length} total={entries.length} compact />
      </div>
      {degraded && (
        <p className="flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-2 text-xs text-amber-200">
          <AlertTriangle size={14} /> Modo reduzido: tipos e atributos indisponíveis temporariamente na fonte de dados.
        </p>
      )}
      {error ? (
        <EmptyState
          title="Não foi possível carregar a Pokédex"
          body={error}
          action={<button type="button" onClick={retry} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-ink"><RotateCw size={14} /> Tentar novamente</button>}
        />
      ) : loading ? (
        <GridSkeleton count={18} />
      ) : results.length === 0 ? (
        <EmptyState title="Nenhum Pokémon encontrado" body="Tente remover alguns filtros ou buscar por outro nome." />
      ) : (
        <VirtualGrid items={results} />
      )}
    </div>
  );
}
