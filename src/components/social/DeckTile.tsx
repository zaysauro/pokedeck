import Link from "next/link";
import { Heart, Layers3, MessageCircle } from "lucide-react";
import { FORMATS, labelOf, type DeckSummary } from "@/lib/social/types";
import { cardImage } from "@/lib/tcg/constants";
import { Avatar, displayName } from "./Avatar";

/** A published TCG deck as a collectible "deck box": cover scan fanned over two card backs. */
export function DeckTile({ deck, rank, showStatus }: { deck: DeckSummary; rank?: number; showStatus?: boolean }) {
  const cover = cardImage(deck.cover_image, "low");
  return (
    <Link href={deck.status === "published" ? `/d/${deck.id}` : `/decks-tcg/${deck.id}`} className="group relative flex flex-col overflow-hidden rounded-[22px] border border-white/10 bg-ink-2 transition hover:-translate-y-1 hover:border-white/25">
      <div className="relative h-52 overflow-hidden bg-[radial-gradient(80%_90%_at_50%_100%,rgb(255_122_47/.25),transparent_70%),linear-gradient(180deg,#1a1410,#0d0d10)]">
        <div className="dot-grid absolute inset-0 opacity-50" />
        {rank !== undefined && (
          <span className={`absolute left-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full font-mono text-xs ${rank <= 3 ? "bg-gold text-ink" : "bg-black/50 text-white/70"}`}>{rank}</span>
        )}
        {showStatus && deck.status === "draft" && <span className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-2.5 py-1 font-mono text-[10px] uppercase text-white/70">Rascunho</span>}
        <div className="absolute inset-x-0 bottom-[-28%] flex justify-center">
          <span className="absolute h-[150%] w-[38%] -translate-x-[38%] rotate-[-10deg] rounded-[4.5%] border border-white/10 bg-gradient-to-b from-[#2a1f19] to-[#141012] transition-transform duration-500 group-hover:-translate-x-[48%] group-hover:rotate-[-14deg]" />
          <span className="absolute h-[150%] w-[38%] translate-x-[38%] rotate-[10deg] rounded-[4.5%] border border-white/10 bg-gradient-to-b from-[#2a1f19] to-[#141012] transition-transform duration-500 group-hover:translate-x-[48%] group-hover:rotate-[14deg]" />
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" loading="lazy" className="relative h-[150%] w-auto rounded-[4.5%] shadow-[0_20px_40px_rgba(0,0,0,.6)] transition-transform duration-500 group-hover:-translate-y-3" />
          ) : (
            <span className="relative grid h-[150%] w-[38%] place-items-center rounded-[4.5%] border border-white/15 bg-ink text-white/30"><Layers3 /></span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <span className="rounded-[5px] border border-white/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white/60">{labelOf(FORMATS, deck.format)}</span>
          <span className="font-mono text-[10px] text-white/35">{deck.card_count}/60</span>
        </div>
        <h3 className="display mt-2 line-clamp-2 text-2xl leading-tight text-white">{deck.title}</h3>
        {deck.description && <p className="mt-1 line-clamp-2 text-xs text-white/50">{deck.description}</p>}
        <div className="mt-auto flex items-center gap-2 pt-4">
          <Avatar dex={deck.author.avatar_dex} size={24} />
          <span className="min-w-0 flex-1 truncate text-xs text-white/60">{displayName(deck.author)}</span>
          <span className="flex items-center gap-1 font-mono text-[11px] text-white/50"><Heart size={12} /> {deck.likes}</span>
          <span className="flex items-center gap-1 font-mono text-[11px] text-white/50"><MessageCircle size={12} /> {deck.comments}</span>
        </div>
      </div>
    </Link>
  );
}

export function DeckGrid({ decks, ranked, showStatus }: { decks: DeckSummary[]; ranked?: boolean; showStatus?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {decks.map((d, i) => <DeckTile key={d.id} deck={d} rank={ranked ? i + 1 : undefined} showStatus={showStatus} />)}
    </div>
  );
}
