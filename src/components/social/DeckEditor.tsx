"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, Globe2, ImageIcon, Minus, Plus, Save, Trash2 } from "lucide-react";
import { deleteDeckAction, saveDeckAction } from "@/app/actions/social";
import { FORMATS, type DeckCardRow, type DeckDetail } from "@/lib/social/types";
import { toast } from "@/components/ui/Toast";
import { CardPicker, toCardInput } from "./CardPicker";
import { Thumb } from "./CollectionManager";

const field = "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[var(--accent)]";
const isBasicEnergy = (c: DeckCardRow) => c.category === "Energia" && /b[aá]sica/i.test(c.card_name);

/** TCG deck builder (60-card lists). Publishing makes it public; it never affects trading. */
export function DeckEditor({ deck }: { deck: DeckDetail | null }) {
  const router = useRouter();
  const [f, setF] = useState({
    title: deck?.title ?? "",
    description: deck?.description ?? "",
    strategy: deck?.strategy ?? "",
    format: deck?.format ?? "standard",
    main_card_id: deck?.main_card_id ?? null as string | null,
    main_card_name: deck?.main_card_name ?? null as string | null,
    cover_image: deck?.cover_image ?? null as string | null,
  });
  const [cards, setCards] = useState<DeckCardRow[]>(deck?.cards ?? []);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const published = deck?.status === "published";

  const total = cards.reduce((n, c) => n + c.quantity, 0);
  const warnings = useMemo(() => {
    const w: string[] = [];
    if (total !== 60) w.push(`O deck tem ${total} cartas (decks oficiais têm exatamente 60).`);
    const byName = new Map<string, number>();
    cards.filter((c) => !isBasicEnergy(c)).forEach((c) => byName.set(c.card_name, (byName.get(c.card_name) ?? 0) + c.quantity));
    for (const [name, n] of byName) if (n > 4) w.push(`${name}: ${n} cópias (máximo de 4 por nome, exceto Energias Básicas).`);
    if (!cards.some((c) => c.category === "Pokémon")) w.push("Inclua pelo menos um Pokémon.");
    return w;
  }, [cards, total]);

  const setQty = (id: string, q: number) => setCards((list) => list.flatMap((c) => (c.card_id === id ? (q <= 0 ? [] : [{ ...c, quantity: Math.min(q, 60) }]) : [c])));

  const save = async (publish?: boolean) => {
    setBusy(true);
    const r = await saveDeckAction(deck?.id ?? null, { ...f, cards }, publish);
    setBusy(false);
    if (!r.ok) return toast(r.error, "warn");
    toast(publish === true ? "Deck publicado!" : publish === false ? "Deck voltou para rascunho" : "Deck salvo");
    if (publish === true) router.push(`/d/${r.data}`);
    else if (!deck) router.replace(`/decks-tcg/${r.data}`);
    else router.refresh();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-ink-2 p-5">
          <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={60} placeholder="Nome do deck" aria-label="Nome do deck" className="display w-full bg-transparent text-5xl text-white outline-none placeholder:text-white/20" />
          <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={500} rows={2} placeholder="Descrição curta (aparece nos cards e nas buscas)" className={`${field} resize-none py-3`} />
          <div className="flex flex-wrap gap-2">
            {FORMATS.map(([k, l]) => (
              <button key={k} type="button" aria-pressed={f.format === k} onClick={() => setF({ ...f, format: k })} className={`h-9 rounded-full px-4 text-xs transition ${f.format === k ? "bg-white text-ink" : "border border-white/10 text-white/65 hover:text-white"}`}>{l}</button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-ink-2 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="eyebrow">Lista de cartas <span className={`ml-2 font-mono ${total === 60 ? "text-emerald-300" : "text-white/60"}`}>{total}/60</span></p>
            <button type="button" onClick={() => setPicker(true)} disabled={total >= 60} className="flex h-10 items-center gap-2 rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-[var(--on-accent)] disabled:opacity-40"><Plus size={15} /> Adicionar cartas</button>
          </div>
          {cards.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-sm text-white/40">Busque cartas do catálogo TCG para montar sua lista.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {cards.map((c) => {
                const isCover = f.cover_image === c.card_image && c.card_image;
                return (
                  <li key={c.card_id} className="flex items-center gap-3 py-2">
                    <Thumb src={c.card_image} alt={c.card_name} w={34} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-white">{c.card_name}</span>
                      <span className="font-mono text-[10px] text-white/35">{c.category ?? "—"} · {c.card_id}</span>
                    </span>
                    <button type="button" title="Usar como capa e Pokémon principal" aria-pressed={Boolean(isCover)} onClick={() => setF({ ...f, cover_image: c.card_image, main_card_id: c.category === "Pokémon" ? c.card_id : f.main_card_id, main_card_name: c.category === "Pokémon" ? c.card_name : f.main_card_name })} className={`grid h-8 w-8 place-items-center rounded-full ${isCover ? "bg-gold/20 text-gold" : "text-white/30 hover:text-white"}`}>
                      <ImageIcon size={14} />
                    </button>
                    <div className="flex h-8 items-center rounded-full border border-white/10">
                      <button type="button" aria-label="Menos uma cópia" onClick={() => setQty(c.card_id, c.quantity - 1)} className="grid h-8 w-8 place-items-center text-white/60"><Minus size={12} /></button>
                      <span className="w-6 text-center font-mono text-sm">{c.quantity}</span>
                      <button type="button" aria-label="Mais uma cópia" disabled={total >= 60} onClick={() => setQty(c.card_id, c.quantity + 1)} className="grid h-8 w-8 place-items-center text-white/60 disabled:opacity-30"><Plus size={12} /></button>
                    </div>
                    <button type="button" aria-label="Remover carta" onClick={() => setQty(c.card_id, 0)} className="text-white/25 hover:text-red-300"><Trash2 size={14} /></button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-ink-2 p-5">
          <p className="eyebrow mb-3">Estratégia</p>
          <textarea value={f.strategy} onChange={(e) => setF({ ...f, strategy: e.target.value })} maxLength={4000} rows={8} placeholder="Como o deck vence? Linhas de jogo, combos, matchups, substituições…" className={`${field} resize-y py-3 leading-relaxed`} />
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-3xl border border-white/10 bg-ink-2 p-5">
          <p className="eyebrow mb-3">Capa</p>
          {f.cover_image ? <Thumb src={f.cover_image} alt="Capa" w={140} /> : <p className="text-xs text-white/40">Toque no ícone de imagem de uma carta para defini-la como capa.</p>}
          {f.main_card_name && <p className="mt-3 text-xs text-white/55">Pokémon principal: <span className="text-white">{f.main_card_name}</span></p>}
        </div>
        <div className="rounded-3xl border border-white/10 bg-ink-2 p-5">
          {warnings.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 size={15} /> Lista dentro das regras básicas.</p>
          ) : (
            <ul className="space-y-1.5">
              {warnings.map((w) => <li key={w} className="flex gap-2 text-xs text-amber-200/90"><AlertTriangle size={13} className="mt-0.5 shrink-0" /> {w}</li>)}
            </ul>
          )}
          <p className="mt-3 text-[10px] leading-relaxed text-white/30">Verificação simplificada — não substitui as regras oficiais de legalidade de cada formato.</p>
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" disabled={busy} onClick={() => save()} className="flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 text-sm text-white/85 hover:border-white/40 disabled:opacity-40"><Save size={15} /> Salvar {published ? "alterações" : "rascunho"}</button>
          {!published ? (
            <button type="button" disabled={busy || cards.length === 0 || !f.title.trim()} onClick={() => save(true)} className="flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-sm font-medium text-[var(--on-accent)] disabled:opacity-40"><Globe2 size={15} /> Publicar deck</button>
          ) : (
            <>
              <Link href={`/d/${deck!.id}`} className="flex h-11 items-center justify-center gap-2 rounded-full bg-white text-sm text-ink"><Eye size={15} /> Ver página pública</Link>
              <button type="button" disabled={busy} onClick={() => save(false)} className="h-10 text-xs text-white/50 hover:text-white">Despublicar (voltar a rascunho)</button>
            </>
          )}
          {deck && (
            <button type="button" disabled={busy} onClick={async () => {
              if (!confirm("Excluir este deck? Curtidas e comentários também serão removidos.")) return;
              const r = await deleteDeckAction(deck.id);
              if (!r.ok) return toast(r.error, "warn");
              toast("Deck excluído");
              router.push("/decks-tcg");
            }} className="h-10 text-xs text-white/40 hover:text-red-300">Excluir deck</button>
          )}
        </div>
      </aside>

      <CardPicker
        open={picker}
        onClose={() => setPicker(false)}
        title="Adicionar ao deck"
        subtitle={`${total}/60 cartas`}
        onPick={async (b) => {
          const input = await toCardInput(b);
          setCards((list) => {
            const hit = list.find((c) => c.card_id === input.card_id);
            if (hit) return list.map((c) => (c.card_id === input.card_id ? { ...c, quantity: Math.min(c.quantity + 1, 60) } : c));
            return [...list, { card_id: input.card_id, card_name: input.card_name, card_image: input.card_image ?? null, quantity: 1, category: input.category ?? null }];
          });
          if (!f.cover_image && input.category === "Pokémon") {
            setF((s) => ({ ...s, cover_image: input.card_image ?? null, main_card_id: input.card_id, main_card_name: input.card_name }));
          }
          toast(`${input.card_name} +1`);
        }}
      />
    </div>
  );
}
