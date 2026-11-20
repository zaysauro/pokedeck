"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Star } from "lucide-react";
import { rarityTier, tcgTypeColor } from "@/lib/tcg/constants";
import { TcgImage } from "@/components/tcg/TcgImage";

interface ShowcaseItem {
  id: number;
  card_id: string;
  card_name: string;
  card_image: string | null;
  set_id: string | null;
  set_name: string | null;
  local_id: string | null;
  rarity: string | null;
  card_type: string | null;
  quantity: number;
  favorite: boolean;
}

const sel = "h-10 rounded-full border border-white/10 bg-ink-2 px-4 text-sm text-white outline-none [&>option]:bg-ink-2";

/** Public collection showcase: filters by set, rarity and type, plus quick stats. No private fields. */
export function Showcase({ items }: { items: ShowcaseItem[] }) {
  const [set, setSet] = useState("");
  const [rarity, setRarity] = useState("");
  const [type, setType] = useState("");
  const [favOnly, setFavOnly] = useState(false);

  const options = useMemo(() => ({
    sets: [...new Map(items.filter((i) => i.set_id).map((i) => [i.set_id!, i.set_name ?? i.set_id!])).entries()],
    rarities: [...new Set(items.map((i) => i.rarity).filter(Boolean) as string[])].sort(),
    types: [...new Set(items.map((i) => i.card_type).filter(Boolean) as string[])].sort(),
  }), [items]);

  const list = items.filter((i) => (!set || i.set_id === set) && (!rarity || i.rarity === rarity) && (!type || i.card_type === type) && (!favOnly || i.favorite));
  const stats = {
    copies: items.reduce((n, i) => n + i.quantity, 0),
    unique: new Set(items.map((i) => i.card_id)).size,
    sets: options.sets.length,
    rare: items.filter((i) => rarityTier(i.rarity) >= 2).length,
  };

  if (!items.length) return <p className="text-sm text-white/45">A vitrine está vazia por enquanto.</p>;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["Cópias", stats.copies], ["Cartas únicas", stats.unique], ["Coleções", stats.sets], ["Raras e especiais", stats.rare]].map(([k, v]) => (
          <div key={k as string} className="rounded-2xl border border-white/10 bg-ink-2 px-4 py-3">
            <p className="eyebrow">{k}</p>
            <p className="mt-1 font-mono text-xl text-white">{v}</p>
          </div>
        ))}
      </div>
      {options.types.length > 0 && (
        <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-white/5" title="Distribuição por tipo">
          {options.types.map((t) => {
            const n = items.filter((i) => i.card_type === t).length;
            return <span key={t} style={{ width: `${(n / items.length) * 100}%`, background: tcgTypeColor(t) }} title={`${t}: ${n}`} />;
          })}
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-2">
        <select aria-label="Filtrar por coleção" className={sel} value={set} onChange={(e) => setSet(e.target.value)}>
          <option value="">Todas as coleções</option>
          {options.sets.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select aria-label="Filtrar por raridade" className={sel} value={rarity} onChange={(e) => setRarity(e.target.value)}>
          <option value="">Todas as raridades</option>
          {options.rarities.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select aria-label="Filtrar por tipo" className={sel} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Todos os tipos</option>
          {options.types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="button" aria-pressed={favOnly} onClick={() => setFavOnly(!favOnly)} className={`flex h-10 items-center gap-1.5 rounded-full px-4 text-sm ${favOnly ? "bg-gold text-ink" : "border border-white/10 text-white/65"}`}>
          <Star size={13} fill={favOnly ? "currentColor" : "none"} /> Favoritas
        </button>
        <span className="ml-auto self-center font-mono text-xs text-white/40">{list.length} carta(s)</span>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {list.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 6) * 0.03 }}>
            <Link href={`/cards/${encodeURIComponent(c.card_id)}`} className="group block">
              <div data-tier={rarityTier(c.rarity)} className="tcg-card relative rounded-[4.5%] transition-transform duration-500 group-hover:-translate-y-1">
                <TcgImage base={c.card_image} alt={c.card_name} label={c.card_name} />
                {c.quantity > 1 && <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 font-mono text-[10px] text-white">×{c.quantity}</span>}
                {c.favorite && <Star size={14} className="absolute left-2 top-2 text-gold" fill="currentColor" />}
              </div>
              <p className="mt-2 truncate text-[12px] text-white">{c.card_name}</p>
              <p className="truncate font-mono text-[10px] uppercase text-white/35">{c.set_name} · {c.local_id}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
