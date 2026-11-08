"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, Reorder } from "motion/react";
import {
  ArrowLeft, ArrowRight, Copy, Download, ExternalLink, GripVertical, Image as ImageIcon, Plus, RefreshCw,
  Share2, Star, Trash2, X,
} from "lucide-react";
import { collection, encodeShare, exportTeams, MAX_TEAM, useCollection } from "@/hooks/useCollection";
import { useMembers } from "@/hooks/useMembers";
import { copyText, downloadJson, slugify } from "@/lib/download";
import { dexNumber, formatDate } from "@/lib/format";
import { paletteFor, paletteVars } from "@/lib/palette";
import { FanDeck } from "@/components/deck/FanDeck";
import { PokeImage } from "@/components/ui/PokeImage";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { StatBars } from "@/components/charts/StatBars";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toast";
import { PokemonPicker } from "./PokemonPicker";
import { TeamAnalysis } from "./TeamAnalysis";
import { ConfirmButton } from "@/components/ui/ConfirmButton";

type PickerMode = { mode: "add" } | { mode: "replace"; index: number } | null;

export function TeamBuilder({ id }: { id: string }) {
  const router = useRouter();
  const hydrated = useCollection((s) => s.hydrated);
  const team = useCollection((s) => s.teams.find((t) => t.id === id));
  const { members } = useMembers(team?.members ?? []);
  const [selected, setSelected] = useState<number | null>(null);
  const [picker, setPicker] = useState<PickerMode>(null);
  const [order, setOrder] = useState<string[]>([]);

  useEffect(() => setOrder(members.map((m) => m.key)), [members]);
  useEffect(() => {
    if (selected !== null && selected >= members.length) setSelected(null);
  }, [members.length, selected]);
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (selected === null) return;
    const t = setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 250);
    return () => clearTimeout(t);
  }, [selected]);

  const cover = members.find((m) => m.id === team?.coverId) ?? members[0];
  const palette = useMemo(() => paletteFor(cover?.types.length ? cover.types : ["normal"]), [cover]);

  if (!hydrated) return <div className="skeleton mx-auto mt-40 h-[420px] max-w-5xl rounded-3xl" />;
  if (!team) {
    return (
      <div className="pt-40">
        <EmptyState title="Deck não encontrado" body="Ele pode ter sido excluído ou pertence a outro navegador." action={<Link href="/teams" className="rounded-full bg-white px-4 py-2 text-sm text-ink">Ver meus decks</Link>} />
      </div>
    );
  }

  const full = team.members.length >= MAX_TEAM;
  const sel = selected !== null ? members[selected] : null;

  const update = (patch: Parameters<typeof collection.updateTeam>[1]) => collection.updateTeam(team.id, patch);
  const removeAt = (i: number) => {
    const name = members[i]?.display;
    update({ members: team.members.filter((_, j) => j !== i), coverId: team.coverId === team.members[i] ? team.members.find((_, j) => j !== i) ?? null : team.coverId });
    setSelected(null);
    toast(`${name} saiu do deck`);
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= team.members.length) return;
    const next = [...team.members];
    [next[i], next[j]] = [next[j], next[i]];
    update({ members: next });
    setSelected(j);
  };
  const onPick = (pid: number) => {
    if (picker?.mode === "replace") {
      const next = [...team.members];
      next[picker.index] = pid;
      update({ members: next, coverId: team.coverId === team.members[picker.index] ? pid : team.coverId });
      setPicker(null);
      toast("Pokémon substituído");
      return;
    }
    if (full) {
      toast(`Um deck tem no máximo ${MAX_TEAM} Pokémon`, "warn");
      return;
    }
    collection.addToTeam(team.id, pid);
    if (team.members.length + 1 >= MAX_TEAM) setPicker(null);
  };

  const share = async () => {
    const url = `${window.location.origin}/teams/share?d=${encodeShare(team)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `PokéDeck — ${team.name}`, url });
        return;
      } catch {
        /* user cancelled or unsupported: fall back to clipboard */
      }
    }
    toast((await copyText(url)) ? "Link do deck copiado" : "Não foi possível copiar o link", "ok");
  };

  return (
    <div style={paletteVars(palette)} className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px]"
        style={{ background: `radial-gradient(60% 50% at 50% 30%, ${palette.primary}33, transparent 70%), linear-gradient(180deg, ${palette.deep}, transparent)` }}
      />
      <div className="mx-auto max-w-[1440px] px-4 pt-28 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/teams" className="eyebrow inline-flex items-center gap-2 hover:text-white">
            <ArrowLeft size={12} /> My Decks
          </Link>
          <div className="flex flex-wrap gap-2">
            <IconBtn label={team.favorite ? "Remover destaque" : "Marcar como favorito"} active={team.favorite} onClick={() => update({ favorite: !team.favorite })}>
              <Star size={15} fill={team.favorite ? "currentColor" : "none"} />
            </IconBtn>
            <IconBtn label="Compartilhar" onClick={share}><Share2 size={15} /></IconBtn>
            <IconBtn label="Exportar JSON" onClick={() => downloadJson(`pokedeck-${slugify(team.name)}.json`, exportTeams([team]))}><Download size={15} /></IconBtn>
            <IconBtn
              label="Duplicar"
              onClick={() => {
                const copy = collection.duplicateTeam(team.id);
                if (copy) { toast("Deck duplicado"); router.push(`/teams/${copy.id}`); }
              }}
            >
              <Copy size={15} />
            </IconBtn>
            <ConfirmButton
              onConfirm={() => { collection.deleteTeam(team.id); toast("Deck excluído"); router.push("/teams"); }}
              label="Excluir deck"
              confirmLabel="Excluir?"
            >
              <Trash2 size={15} />
            </ConfirmButton>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <input
              value={team.name}
              onChange={(e) => update({ name: e.target.value.slice(0, 60) })}
              aria-label="Nome do deck"
              className="display w-full bg-transparent text-[52px] text-white outline-none placeholder:text-white/20 md:text-[84px]"
              placeholder="Nome do deck"
            />
            <textarea
              value={team.description}
              onChange={(e) => update({ description: e.target.value.slice(0, 280) })}
              rows={2}
              placeholder="Descreva a estratégia, o tema ou a história deste deck…"
              aria-label="Descrição do deck"
              className="mt-1 w-full max-w-2xl resize-none bg-transparent text-sm leading-relaxed text-white/70 outline-none placeholder:text-white/25"
            />
          </div>
          <div className="flex items-end gap-6 font-mono text-xs text-white/45">
            <div><p className="eyebrow">Integrantes</p><p className="mt-1 text-2xl text-white">{team.members.length}<span className="text-white/35">/{MAX_TEAM}</span></p></div>
            <div><p className="eyebrow">Criado em</p><p className="mt-2 text-sm text-white/80">{formatDate(team.createdAt)}</p></div>
          </div>
        </div>

        {/* ------------------------------ FAN ------------------------------ */}
        <section className="relative mt-6 rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent px-2 pt-10 md:px-8">
          <div className="dot-grid absolute inset-0 -z-10 rounded-[28px] opacity-50" />
          <FanDeck
            members={members}
            slots={MAX_TEAM}
            selected={selected}
            onSelect={setSelected}
            onEmptyClick={() => setPicker({ mode: "add" })}
            size="lg"
          />
          <p className="pb-4 text-center text-[11px] text-white/35">Passe o mouse para abrir o leque · clique em uma carta para ver detalhes</p>
        </section>

        {/* ------------------------- SELECTED PANEL ------------------------- */}
        <AnimatePresence mode="wait">
          {sel && selected !== null && (
            <motion.section
              ref={panelRef}
              key={sel.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-6 grid scroll-mb-28 gap-6 rounded-3xl border border-white/10 bg-ink-2 p-5 md:grid-cols-[200px_1fr_auto] md:p-6"
            >
              <PokeImage id={sel.id} alt={sel.display} className="mx-auto h-44 w-44 object-contain" />
              <div>
                <p className="font-mono text-xs text-white/40">{dexNumber(sel.id)} · Slot {selected + 1}</p>
                <h3 className="display text-5xl">{sel.display}</h3>
                <div className="mt-2 flex gap-1.5">{sel.types.map((t) => <TypeBadge key={t} type={t} />)}</div>
                <div className="mt-5 max-w-xl"><StatBars stats={sel.stats} /></div>
              </div>
              <div className="flex flex-row flex-wrap content-start gap-2 md:w-48 md:flex-col">
                <Link href={`/pokemon/${sel.id}`} className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm text-ink"><ExternalLink size={14} /> Ver ficha</Link>
                <ActionBtn onClick={() => setPicker({ mode: "replace", index: selected })}><RefreshCw size={14} /> Substituir</ActionBtn>
                <ActionBtn onClick={() => update({ coverId: sel.id })} disabled={team.coverId === sel.id}><ImageIcon size={14} /> {team.coverId === sel.id ? "É a capa" : "Usar como capa"}</ActionBtn>
                <div className="flex gap-2">
                  <ActionBtn onClick={() => move(selected, -1)} disabled={selected === 0} aria-label="Mover para a esquerda"><ArrowLeft size={14} /></ActionBtn>
                  <ActionBtn onClick={() => move(selected, 1)} disabled={selected === members.length - 1} aria-label="Mover para a direita"><ArrowRight size={14} /></ActionBtn>
                  <ActionBtn onClick={() => setSelected(null)} aria-label="Fechar detalhes"><X size={14} /></ActionBtn>
                </div>
                <ActionBtn onClick={() => removeAt(selected)} danger><Trash2 size={14} /> Remover</ActionBtn>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* --------------------------- SLOT ORDER --------------------------- */}
        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <p className="eyebrow">Ordem do deck — arraste para reordenar</p>
            <button
              type="button"
              disabled={full}
              onClick={() => setPicker({ mode: "add" })}
              className="flex h-10 items-center gap-2 rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-[var(--on-accent)] transition hover:brightness-110 disabled:opacity-40"
            >
              <Plus size={15} /> {full ? "Deck completo" : "Adicionar Pokémon"}
            </button>
          </div>
          {members.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/40">Este deck está vazio. Adicione até seis Pokémon.</p>
          ) : (
            <Reorder.Group
              axis="x"
              values={order}
              onReorder={(keys) => {
                setOrder(keys);
                const byKey = new Map(members.map((m) => [m.key, m.id]));
                update({ members: keys.map((k) => byKey.get(k)!).filter(Boolean) });
              }}
              className="no-scrollbar flex gap-2 overflow-x-auto pb-2"
            >
              {order.map((k) => {
                const m = members.find((x) => x.key === k);
                if (!m) return null;
                const i = members.indexOf(m);
                return (
                  <Reorder.Item
                    key={k}
                    value={k}
                    className="flex w-40 shrink-0 cursor-grab touch-pan-y items-center gap-2 rounded-xl border border-white/10 bg-ink-2 p-2 active:cursor-grabbing"
                    whileDrag={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,.5)" }}
                  >
                    <GripVertical size={14} className="shrink-0 text-white/30" />
                    <PokeImage id={m.id} style_="sprite" alt="" className="h-10 w-10 object-contain [image-rendering:pixelated]" />
                    <button type="button" onClick={() => setSelected(i)} className="min-w-0 flex-1 text-left">
                      <span className="block font-mono text-[9px] text-white/35">{i + 1}</span>
                      <span className="block truncate text-xs text-white">{m.display}</span>
                    </button>
                    <button type="button" onClick={() => removeAt(i)} aria-label={`Remover ${m.display}`} className="text-white/30 hover:text-red-300"><X size={13} /></button>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          )}
        </section>

        {/* ---------------------------- ANALYSIS ---------------------------- */}
        <section className="mt-16">
          <h2 className="display mb-6 text-5xl md:text-6xl">Análise do <em className="italic text-[var(--accent)]">deck</em></h2>
          <TeamAnalysis members={members} />
        </section>
      </div>

      <PokemonPicker
        open={picker !== null}
        onClose={() => setPicker(null)}
        onPick={onPick}
        title={picker?.mode === "replace" ? "Substituir" : "Adicionar"}
        subtitle={picker?.mode === "replace" ? `Escolha quem entra no slot ${picker.index + 1}` : `${team.members.length}/${MAX_TEAM} no deck`}
        disabledIds={picker?.mode === "add" && full ? [] : []}
      />
    </div>
  );
}

function IconBtn({ label, onClick, children, active }: { label: string; onClick: () => void; children: React.ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`grid h-10 w-10 place-items-center rounded-full border transition ${active ? "border-gold/60 bg-gold/15 text-gold" : "border-white/15 text-white/70 hover:border-white/40 hover:text-white"}`}
    >
      {children}
    </button>
  );
}

function ActionBtn({ children, danger, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      className={`flex h-10 items-center justify-center gap-2 rounded-full border px-4 text-sm transition disabled:opacity-35 ${danger ? "border-red-400/30 text-red-300 hover:bg-red-500/10" : "border-white/15 text-white/80 hover:border-white/40"}`}
    >
      {children}
    </button>
  );
}
