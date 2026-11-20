import Link from "next/link";
import { Crown, Feather, Footprints, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import { rarityTier } from "@/lib/tcg/constants";
import type { TcgCard } from "@/lib/tcg/types";
import { Energy, EnergyCost, TcgTypePill } from "./Energy";

const VARIANT_PT: Record<string, string> = {
  normal: "Normal", reverse: "Reverse Holo", holo: "Holo", firstEdition: "1ª edição", wPromo: "Promo W",
};

export function RarityBadge({ rarity }: { rarity?: string }) {
  if (!rarity || rarity === "None") return null;
  const tier = rarityTier(rarity);
  const cls =
    tier === 3 ? "border-gold/60 bg-gold/15 text-gold" :
    tier === 2 ? "border-white/30 bg-white/10 text-white" :
    "border-white/15 text-white/70";
  return (
    <span className={`inline-flex h-7 items-center gap-1.5 rounded-[5px] border px-2.5 font-mono text-[11px] uppercase tracking-wider ${cls}`}>
      {tier === 3 ? <Crown size={12} /> : tier === 2 ? <Sparkles size={12} /> : null} {rarity}
    </span>
  );
}

/** Everything printed on the card, organized for reading. Shared by the page and the quick view. */
export function CardInfo({ card, headingLevel = 1 }: { card: TcgCard; headingLevel?: 1 | 2 }) {
  const H = headingLevel === 1 ? "h1" : "h2";
  const official = card.set.cardCount?.official;
  const isPokemon = card.category === "Pokémon";

  return (
    <div>
      <p className="eyebrow">
        <Link href={`/cards/sets/${encodeURIComponent(card.set.id)}`} className="hover:text-white">{card.set.name}</Link>
        {" · "}
        {card.localId}{official ? `/${String(official).padStart(String(card.localId).length, "0")}` : ""}
      </p>
      <H className="display mt-3 text-[48px] text-white md:text-[68px]">{card.name}</H>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex h-7 items-center rounded-[5px] border border-white/15 px-2.5 font-mono text-[11px] uppercase tracking-wider text-white/70">
          {card.category}{card.trainerType ? ` · ${card.trainerType}` : ""}{card.energyType ? ` · ${card.energyType}` : ""}
        </span>
        {card.stage && <span className="inline-flex h-7 items-center rounded-[5px] border border-white/15 px-2.5 font-mono text-[11px] uppercase tracking-wider text-white/70">{card.stage}</span>}
        {card.types?.map((t) => <TcgTypePill key={t} type={t} />)}
        <RarityBadge rarity={card.rarity} />
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-4">
        {[
          ["HP", card.hp ? String(card.hp) : "—"],
          ["Recuo", card.retreat !== undefined ? String(card.retreat) : "—"],
          ["Coleção", card.set.name],
          ["Regulação", card.regulationMark ?? "—"],
        ].map(([k, v]) => (
          <div key={k} className="bg-ink/80 px-4 py-3">
            <dt className="eyebrow">{k}</dt>
            <dd className="mt-1 truncate font-mono text-base text-white" title={v}>{v}</dd>
          </div>
        ))}
      </dl>

      {card.evolveFrom && (
        <p className="mt-4 text-sm text-white/55">
          Evolui de{" "}
          <Link href={`/cards?q=${encodeURIComponent(card.evolveFrom)}`} className="text-white underline decoration-white/25 underline-offset-4 hover:decoration-[var(--accent)]">
            {card.evolveFrom}
          </Link>
        </p>
      )}

      {card.abilities?.map((a) => (
        <section key={a.name} className="mt-6 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/[0.06] p-4">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--accent)]">
            <Sparkles size={13} /> {a.type ?? "Habilidade"}
          </p>
          <h3 className="display mt-1 text-2xl text-white">{a.name}</h3>
          {a.effect && <p className="mt-1.5 text-sm leading-relaxed text-white/70">{a.effect}</p>}
        </section>
      ))}

      {card.attacks && card.attacks.length > 0 && (
        <section className="mt-6">
          <p className="eyebrow mb-2">Ataques</p>
          <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
            {card.attacks.map((a, i) => (
              <li key={`${a.name}-${i}`} className="p-4">
                <div className="flex items-center gap-3">
                  <EnergyCost cost={a.cost} />
                  <span className="flex-1 text-base font-medium text-white">{a.name}</span>
                  {a.damage !== undefined && a.damage !== "" && <span className="font-mono text-xl text-[var(--accent)]">{a.damage}</span>}
                </div>
                {a.effect && <p className="mt-2 text-sm leading-relaxed text-white/60">{a.effect}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {card.effect && (
        <section className="mt-6">
          <p className="eyebrow mb-2">Efeito</p>
          <p className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-relaxed text-white/75">{card.effect}</p>
        </section>
      )}

      {isPokemon && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat icon={<ShieldAlert size={13} />} label="Fraqueza" tone="text-red-300">
            {card.weaknesses?.length ? card.weaknesses.map((w) => <span key={w.type} className="flex items-center gap-1.5"><Energy type={w.type} size={18} /> {w.value}</span>) : "—"}
          </Stat>
          <Stat icon={<ShieldCheck size={13} />} label="Resistência" tone="text-emerald-300">
            {card.resistances?.length ? card.resistances.map((r) => <span key={r.type} className="flex items-center gap-1.5"><Energy type={r.type} size={18} /> {r.value}</span>) : "—"}
          </Stat>
          <Stat icon={<Footprints size={13} />} label="Custo de recuo" tone="text-white/70">
            {card.retreat ? <EnergyCost cost={Array(card.retreat).fill("Incolor")} size={18} /> : "0"}
          </Stat>
        </div>
      )}

      {card.description && (
        <blockquote className="display mt-8 text-2xl leading-snug text-white/80">“{card.description}”</blockquote>
      )}

      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-5 text-xs text-white/50">
        {card.illustrator && (
          <span className="flex items-center gap-1.5">
            <Feather size={12} /> Ilustração:{" "}
            <Link href={`/cards?illustrator=${encodeURIComponent(card.illustrator)}`} className="text-white/85 underline decoration-white/20 underline-offset-4 hover:decoration-[var(--accent)]">
              {card.illustrator}
            </Link>
          </span>
        )}
        {card.legal && (
          <span>
            Formatos: {[card.legal.standard && "Standard", card.legal.expanded && "Expanded"].filter(Boolean).join(" · ") || "fora dos formatos atuais"}
          </span>
        )}
        {card.variants && (
          <span>
            Variações: {Object.entries(card.variants).filter(([, v]) => v).map(([k]) => VARIANT_PT[k] ?? k).join(", ") || "—"}
          </span>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, tone, children }: { icon: React.ReactNode; label: string; tone: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <p className={`mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wider ${tone}`}>{icon} {label}</p>
      <div className="flex flex-wrap items-center gap-2 font-mono text-sm text-white">{children}</div>
    </div>
  );
}
