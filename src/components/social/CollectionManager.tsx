"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeftRight, ArrowUpRight, Download, Minus, Plus, Search, Star, StickyNote, Trash2 } from "lucide-react";
import {
  addItemAction, addWantAction, deleteItemAction, deleteWantAction, importLocalAction, updateItemAction,
} from "@/app/actions/social";
import { CONDITIONS, LANGUAGES, VARIANTS, labelOf, type CollectionItem, type Want } from "@/lib/social/types";
import { norm } from "@/lib/format";
import { cardImage } from "@/lib/tcg/constants";
import { useCardCollection } from "@/hooks/useCardCollection";
import { refreshSession } from "@/hooks/useSession";
import { toast } from "@/components/ui/Toast";
import { CardPicker, toCardInput } from "./CardPicker";

type Tab = "collection" | "trade" | "wants";
const sel = "h-8 rounded-lg border border-white/10 bg-ink px-2 text-xs text-white outline-none [&>option]:bg-ink-2";

export function CollectionManager({ initialItems, initialWants, username }: { initialItems: CollectionItem[]; initialWants: Want[]; username: string }) {
  const [items, setItems] = useState(initialItems);
  const [wants, setWants] = useState(initialWants);
  const [tab, setTab] = useState<Tab>("collection");
  const [q, setQ] = useState("");
  const [picker, setPicker] = useState<null | "item" | "want">(null);
  const local = useCardCollection((s) => s.cards);
  const localCount = Object.values(local).filter((c) => c.owned > 0 || c.wishlist).length;

  const stats = useMemo(() => ({
    copies: items.reduce((n, i) => n + i.quantity, 0),
    unique: new Set(items.map((i) => i.card_id)).size,
    trade: items.reduce((n, i) => n + i.for_trade, 0),
    wants: wants.length,
  }), [items, wants]);

  const filtered = useMemo(() => {
    const n = norm(q.trim());
    const base = tab === "trade" ? items.filter((i) => i.for_trade > 0) : items;
    return n ? base.filter((i) => norm(i.card_name).includes(n) || norm(i.set_name ?? "").includes(n)) : base;
  }, [items, tab, q]);

  const patchItem = async (it: CollectionItem, patch: Partial<CollectionItem>) => {
    const optimistic = { ...it, ...patch };
    setItems((list) => list.map((x) => (x.id === it.id ? optimistic : x)));
    const r = await updateItemAction(it.id, patch);
    if (!r.ok) {
      setItems((list) => list.map((x) => (x.id === it.id ? it : x)));
      toast(r.error, "warn");
    } else {
      setItems((list) => list.map((x) => (x.id === it.id ? r.data : x)));
      if ("for_trade" in patch) void refreshSession();
    }
  };

  const importLocal = async () => {
    const owned = Object.entries(local).filter(([, c]) => c.owned > 0)
      .map(([id, c]) => ({ card_id: id, card_name: c.name, card_image: c.image, set_id: c.setId, set_name: c.setName, local_id: c.localId, quantity: c.owned }));
    const wanted = Object.entries(local).filter(([, c]) => c.wishlist)
      .map(([id, c]) => ({ card_id: id, card_name: c.name, card_image: c.image, set_id: c.setId, set_name: c.setName, local_id: c.localId }));
    const r = await importLocalAction(owned, wanted);
    if (!r.ok) return toast(r.error, "warn");
    toast(`${r.data} carta(s) importada(s) deste navegador`);
    location.reload();
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-4">
        {[["Cópias", stats.copies], ["Cartas únicas", stats.unique], ["Para troca", stats.trade], ["Procurando", stats.wants]].map(([k, v]) => (
          <div key={k} className="bg-ink px-5 py-4">
            <p className="eyebrow">{k}</p>
            <p className="mt-1 font-mono text-2xl text-white">{Number(v).toLocaleString("pt-BR")}</p>
          </div>
        ))}
      </div>

      {localCount > 0 && items.length === 0 && wants.length === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-gold/[0.06] p-4">
          <p className="text-sm text-white/80">Você marcou {localCount} carta(s) como “Tenho” ou “Quero” neste navegador. Quer trazê-las para sua coleção online?</p>
          <button type="button" onClick={importLocal} className="flex h-10 items-center gap-2 rounded-full bg-gold px-4 text-sm text-ink"><Download size={14} /> Importar</button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" className="flex rounded-full border border-white/10 p-1">
          {([["collection", "Coleção"], ["trade", "Para troca"], ["wants", "Procurando"]] as [Tab, string][]).map(([k, label]) => (
            <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={`relative h-9 rounded-full px-4 text-sm transition ${tab === k ? "text-ink" : "text-white/60 hover:text-white"}`}>
              {tab === k && <motion.span layoutId="col-tab" className="absolute inset-0 rounded-full bg-white" />}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
        {tab !== "wants" && (
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 sm:max-w-xs">
            <Search size={14} className="text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" aria-label="Filtrar coleção" />
          </label>
        )}
        <div className="ml-auto flex gap-2">
          <Link href={`/u/${username}`} className="flex h-11 items-center gap-1.5 rounded-full border border-white/15 px-4 text-sm text-white/70 hover:text-white">Ver vitrine <ArrowUpRight size={14} /></Link>
          <button type="button" onClick={() => setPicker(tab === "wants" ? "want" : "item")} className="flex h-11 items-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[var(--on-accent)] hover:brightness-110">
            <Plus size={15} /> {tab === "wants" ? "Procurar carta" : "Adicionar carta"}
          </button>
        </div>
      </div>

      {tab !== "wants" ? (
        filtered.length === 0 ? (
          <Empty text={items.length ? "Nada corresponde ao filtro." : "Sua coleção está vazia. Adicione cartas do catálogo TCG."} />
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {filtered.map((it) => (
                <motion.li key={it.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <ItemRow item={it} onPatch={(p) => patchItem(it, p)} onDelete={async () => {
                    const r = await deleteItemAction(it.id);
                    if (!r.ok) return toast(r.error, "warn");
                    setItems((l) => l.filter((x) => x.id !== it.id));
                  }} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )
      ) : wants.length === 0 ? (
        <Empty text="Cadastre as cartas que você procura. Quando alguém disponibilizá-las para troca, você recebe um match." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {wants.map((w) => (
            <li key={w.id} className="flex gap-3 rounded-2xl border border-white/10 bg-ink-2 p-3">
              <Thumb src={w.card_image} alt={w.card_name} />
              <div className="min-w-0 flex-1">
                <Link href={`/cards/${encodeURIComponent(w.card_id)}`} className="block truncate text-sm text-white hover:underline">{w.card_name}</Link>
                <p className="truncate font-mono text-[10px] uppercase text-white/40">{w.set_name} · {w.local_id}</p>
                <p className="mt-2 text-[11px] text-white/55">
                  {w.language ? labelOf(LANGUAGES, w.language) : "Qualquer idioma"} · {w.variant ? labelOf(VARIANTS, w.variant) : "qualquer variante"} · {w.quantity}×
                </p>
              </div>
              <button type="button" aria-label="Remover da lista de procurados" onClick={async () => {
                const r = await deleteWantAction(w.id);
                if (!r.ok) return toast(r.error, "warn");
                setWants((l) => l.filter((x) => x.id !== w.id));
              }} className="self-start text-white/30 hover:text-red-300"><Trash2 size={15} /></button>
            </li>
          ))}
        </ul>
      )}

      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-white/35">
        <ArrowLeftRight size={12} className="mt-0.5 shrink-0" />
        Só cartas com quantidade “para troca” maior que zero geram matches. Publicar decks ou deixar a coleção pública não coloca nenhuma carta à disposição.
      </p>

      <CardPicker
        open={picker !== null}
        onClose={() => setPicker(null)}
        title={picker === "want" ? "Procurar carta" : "Adicionar à coleção"}
        subtitle={picker === "want" ? "A carta entra na sua lista “Procurando”." : "Adiciona 1 cópia em português — ajuste os detalhes depois."}
        onPick={async (b) => {
          const input = await toCardInput(b);
          if (picker === "want") {
            const r = await addWantAction({ ...input, language: null, variant: null, quantity: 1 });
            if (!r.ok) return toast(r.error, "warn");
            setWants((l) => [r.data, ...l.filter((x) => x.id !== r.data.id)]);
            toast(`${input.card_name} adicionada a “Procurando”`);
          } else {
            const r = await addItemAction({ ...input, quantity: 1, for_trade: 0, language: "pt", variant: "normal" });
            if (!r.ok) return toast(r.error, "warn");
            setItems((l) => [r.data, ...l.filter((x) => x.id !== r.data.id)]);
            toast(`${input.card_name} adicionada à coleção`);
          }
          void refreshSession();
        }}
      />
    </div>
  );
}

function ItemRow({ item: it, onPatch, onDelete }: { item: CollectionItem; onPatch: (p: Partial<CollectionItem>) => void; onDelete: () => void }) {
  const [notes, setNotes] = useState<string | null>(null);
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-2 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <Thumb src={it.card_image} alt={it.card_name} />
        <div className="min-w-0 flex-1 basis-40">
          <Link href={`/cards/${encodeURIComponent(it.card_id)}`} className="block truncate text-sm text-white hover:underline">{it.card_name}</Link>
          <p className="truncate font-mono text-[10px] uppercase text-white/40">{it.set_name ?? "—"} · {it.local_id ?? "—"}{it.rarity ? ` · ${it.rarity}` : ""}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <select aria-label="Idioma" className={sel} value={it.language} onChange={(e) => onPatch({ language: e.target.value as CollectionItem["language"] })}>
              {LANGUAGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <select aria-label="Variante" className={sel} value={it.variant} onChange={(e) => onPatch({ variant: e.target.value as CollectionItem["variant"] })}>
              {VARIANTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <select aria-label="Estado de conservação" className={sel} value={it.condition ?? ""} onChange={(e) => onPatch({ condition: (e.target.value || null) as CollectionItem["condition"] })}>
              <option value="">Estado —</option>
              {CONDITIONS.map(([k, l]) => <option key={k} value={k}>{k} · {l}</option>)}
            </select>
          </div>
        </div>
        <Stepper label="Cópias" value={it.quantity} min={1} max={999} onChange={(v) => onPatch({ quantity: v, for_trade: Math.min(it.for_trade, v) })} />
        <Stepper label="Para troca" value={it.for_trade} min={0} max={it.quantity} accent onChange={(v) => onPatch({ for_trade: v })} />
        <div className="flex items-center gap-1">
          <button type="button" aria-pressed={it.favorite} aria-label="Destacar no perfil" title="Destacar no perfil" onClick={() => onPatch({ favorite: !it.favorite })} className={`grid h-9 w-9 place-items-center rounded-full ${it.favorite ? "text-gold" : "text-white/30 hover:text-white"}`}>
            <Star size={16} fill={it.favorite ? "currentColor" : "none"} />
          </button>
          <button type="button" aria-label="Observações pessoais" title="Observações pessoais (privadas)" onClick={() => setNotes(notes === null ? it.notes ?? "" : null)} className={`grid h-9 w-9 place-items-center rounded-full ${it.notes ? "text-white/80" : "text-white/30"} hover:text-white`}>
            <StickyNote size={15} />
          </button>
          <button type="button" aria-label="Remover da coleção" onClick={onDelete} className="grid h-9 w-9 place-items-center rounded-full text-white/30 hover:text-red-300"><Trash2 size={15} /></button>
        </div>
      </div>
      {notes !== null && (
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); onPatch({ notes: notes || null }); setNotes(null); }}>
          <input autoFocus maxLength={280} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações pessoais (só você vê)" className="h-9 flex-1 rounded-lg border border-white/10 bg-ink px-3 text-sm outline-none focus:border-white/30" />
          <button className="rounded-lg bg-white px-3 text-xs text-ink">Salvar</button>
        </form>
      )}
    </div>
  );
}

function Stepper({ label, value, min, max, onChange, accent }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; accent?: boolean }) {
  return (
    <div className="text-center">
      <p className="eyebrow !text-[9px]">{label}</p>
      <div className={`mt-1 flex h-9 items-center rounded-full border ${accent && value > 0 ? "border-[var(--accent)]/60 bg-[var(--accent)]/10" : "border-white/10"}`}>
        <button type="button" aria-label={`Diminuir ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="grid h-9 w-8 place-items-center text-white/60 disabled:opacity-25"><Minus size={13} /></button>
        <span className="w-7 text-center font-mono text-sm">{value}</span>
        <button type="button" aria-label={`Aumentar ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} className="grid h-9 w-8 place-items-center text-white/60 disabled:opacity-25"><Plus size={13} /></button>
      </div>
    </div>
  );
}

export function Thumb({ src, alt, w = 48 }: { src: string | null; alt: string; w?: number }) {
  const url = cardImage(src, "low");
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} loading="lazy" style={{ width: w }} className="aspect-[63/88] shrink-0 rounded-[4.5%] object-cover ring-1 ring-white/10" />
  ) : (
    <span style={{ width: w }} className="aspect-[63/88] shrink-0 rounded-[4.5%] bg-white/5 ring-1 ring-white/10" />
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center text-sm text-white/45">{text}</p>;
}
