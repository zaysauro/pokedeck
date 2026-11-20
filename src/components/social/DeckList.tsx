import Link from "next/link";
import type { DeckCardRow } from "@/lib/social/types";
import { Thumb } from "./CollectionManager";

const GROUPS: [string, string][] = [["Pokémon", "Pokémon"], ["Treinador", "Treinadores"], ["Energia", "Energias"]];

/** Deck list grouped by card category, like a printed decklist. */
export function DeckList({ cards }: { cards: DeckCardRow[] }) {
  if (!cards.length) return <p className="text-sm text-white/45">Nenhuma carta neste deck.</p>;
  const groups = GROUPS.map(([k, label]) => ({ label, list: cards.filter((c) => c.category === k) }));
  const other = cards.filter((c) => !GROUPS.some(([k]) => k === c.category));
  if (other.length) groups.push({ label: "Outras", list: other });
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {groups.filter((g) => g.list.length).map((g) => (
        <section key={g.label}>
          <p className="eyebrow mb-2 flex justify-between"><span>{g.label}</span><span className="font-mono">{g.list.reduce((n, c) => n + c.quantity, 0)}</span></p>
          <ul className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-ink-2">
            {g.list.map((c) => (
              <li key={c.card_id}>
                <Link href={`/cards/${encodeURIComponent(c.card_id)}`} className="flex items-center gap-3 px-3 py-2 transition hover:bg-white/[0.03]">
                  <span className="w-6 text-right font-mono text-sm text-[var(--accent)]">{c.quantity}×</span>
                  <Thumb src={c.card_image} alt={c.card_name} w={28} />
                  <span className="min-w-0 flex-1 truncate text-sm text-white">{c.card_name}</span>
                  <span className="font-mono text-[10px] text-white/30">{c.card_id}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
