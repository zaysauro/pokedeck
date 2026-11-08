"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef } from "react";
import { AnimatePresence } from "motion/react";
import { Copy, Download, Pencil, Plus, Share2, Trash2, Upload } from "lucide-react";
import { collection, encodeShare, exportTeams, parseTeamImport, useCollection } from "@/hooks/useCollection";
import { copyText, downloadJson } from "@/lib/download";
import { PRESET_DECKS } from "@/lib/presets";
import type { Team } from "@/lib/types";
import { DeckCard } from "@/components/deck/DeckCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { toast } from "@/components/ui/Toast";

export function TeamsView() {
  const router = useRouter();
  const hydrated = useCollection((s) => s.hydrated);
  const teams = useCollection((s) => s.teams);
  const sorted = useMemo(() => [...teams].sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt - a.updatedAt), [teams]);
  const fileRef = useRef<HTMLInputElement>(null);

  const create = () => {
    const t = collection.createTeam({ name: `Deck ${teams.length + 1}` });
    router.push(`/teams/${t.id}`);
  };

  const onImport = async (file: File) => {
    try {
      const parsed = parseTeamImport(JSON.parse(await file.text()));
      collection.importTeams(parsed);
      toast(`${parsed.length} deck(s) importado(s)`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Arquivo inválido", "warn");
    }
  };

  const share = async (t: Team) => {
    const ok = await copyText(`${window.location.origin}/teams/share?d=${encodeShare(t)}`);
    toast(ok ? "Link do deck copiado" : "Não foi possível copiar", ok ? "ok" : "warn");
  };

  return (
    <div className="space-y-20">
      <section>
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button type="button" onClick={create} className="flex h-11 items-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[var(--on-accent)] hover:brightness-110">
            <Plus size={16} /> Novo deck
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="flex h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-sm text-white/80 hover:border-white/40">
            <Upload size={15} /> Importar JSON
          </button>
          <button
            type="button"
            disabled={!teams.length}
            onClick={() => downloadJson(`pokedeck-decks-${new Date().toISOString().slice(0, 10)}.json`, exportTeams(teams))}
            className="flex h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-sm text-white/80 hover:border-white/40 disabled:opacity-40"
          >
            <Download size={15} /> Exportar todos
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImport(f);
              e.target.value = "";
            }}
          />
        </div>

        {!hydrated ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => <div key={i} className="skeleton h-[360px] rounded-[22px]" />)}
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState
            title="Seu primeiro deck espera"
            body="Monte times de até seis Pokémon, analise fraquezas e compartilhe com amigos."
            action={<button type="button" onClick={create} className="rounded-full bg-white px-5 py-2.5 text-sm text-ink">Criar deck</button>}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence>
              {sorted.map((t, i) => (
                <DeckCard
                  key={t.id}
                  index={i}
                  href={`/teams/${t.id}`}
                  name={t.name}
                  description={t.description}
                  members={t.members}
                  coverId={t.coverId}
                  createdAt={t.createdAt}
                  favorite={t.favorite}
                  actions={
                    <div className="relative z-10 flex gap-1">
                      <Mini label="Editar" onClick={() => router.push(`/teams/${t.id}`)}><Pencil size={13} /></Mini>
                      <Mini label="Duplicar" onClick={() => { collection.duplicateTeam(t.id); toast("Deck duplicado"); }}><Copy size={13} /></Mini>
                      <Mini label="Compartilhar" onClick={() => void share(t)}><Share2 size={13} /></Mini>
                      <ConfirmButton label="Excluir" confirmLabel="Excluir?" onConfirm={() => { collection.deleteTeam(t.id); toast("Deck excluído"); }} className="!h-8 [&:not([aria-label^=Confirmar])]:!w-8">
                        <Trash2 size={13} />
                      </ConfirmButton>
                    </div>
                  }
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      <section>
        <p className="eyebrow">Coleções curadas</p>
        <h2 className="display mt-2 text-5xl md:text-6xl">Decks em <em className="italic text-[var(--accent)]">destaque</em></h2>
        <p className="mt-2 max-w-xl text-sm text-white/50">Comece por um deck pronto e personalize do seu jeito.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {PRESET_DECKS.map((d, i) => (
            <DeckCard
              key={d.slug}
              index={i}
              name={d.name}
              description={d.description}
              members={d.members}
              coverId={d.coverId}
              actions={
                <button
                  type="button"
                  onClick={() => {
                    const t = collection.createTeam({ name: d.name, description: d.description, members: d.members, coverId: d.coverId });
                    toast(`“${d.name}” adicionado aos seus decks`);
                    router.push(`/teams/${t.id}`);
                  }}
                  className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-xs text-ink"
                >
                  <Copy size={12} /> Usar este deck
                </button>
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function Mini({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }} className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-white/60 hover:border-white/40 hover:text-white">
      {children}
    </button>
  );
}
