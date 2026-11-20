import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeft } from "lucide-react";
import { assetPng } from "@/lib/tcg/constants";
import { getSet } from "@/services/tcgdex";
import { SetCards } from "@/components/tcg/SetCards";

export const revalidate = 86400;

type Params = { params: Promise<{ id: string }> };
const load = cache((id: string) => getSet(decodeURIComponent(id)));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const set = await load(id).catch(() => null);
  if (!set) return { title: "Coleção não encontrada" };
  const description = `Todas as ${set.total ?? set.cards.length} cartas da coleção ${set.name} (${set.serieName}) do Pokémon TCG${set.releaseDate ? `, lançada em ${new Date(set.releaseDate).getUTCFullYear()}` : ""}.`;
  return {
    title: `${set.name} — Coleção Pokémon TCG`,
    description,
    alternates: { canonical: `/cards/sets/${encodeURIComponent(set.id)}` },
    openGraph: { title: `${set.name} · PokéDeck`, description, images: set.logo ? [assetPng(set.logo)!] : [] },
  };
}

export default async function SetPage({ params }: Params) {
  const { id } = await params;
  const set = await load(id);
  if (!set) notFound();
  const date = set.releaseDate ? new Date(`${set.releaseDate}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : null;

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-28 md:px-6 md:pt-36">
      <nav aria-label="Trilha" className="eyebrow flex items-center gap-2">
        <Link href="/cards" className="inline-flex items-center gap-2 hover:text-white"><ArrowLeft size={12} /> Cartas TCG</Link>
        <span className="text-white/20">/</span>
        <Link href={`/cards?serie=${set.serieId}`} className="hover:text-white">{set.serieName}</Link>
      </nav>
      <header className="mt-8 grid items-center gap-8 md:grid-cols-[1fr_auto]">
        <div>
          <h1 className="display text-[56px] text-white md:text-[96px]">{set.name}</h1>
          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 font-mono text-xs text-white/50">
            {date && <div><dt className="eyebrow">Lançamento</dt><dd className="mt-1 text-sm text-white">{date}</dd></div>}
            <div><dt className="eyebrow">Cartas</dt><dd className="mt-1 text-sm text-white">{set.official ?? "—"}{set.total && set.total !== set.official ? ` + ${set.total - (set.official ?? 0)} secretas` : ""}</dd></div>
            {set.abbreviation && <div><dt className="eyebrow">Sigla</dt><dd className="mt-1 text-sm text-white">{set.abbreviation}</dd></div>}
            {set.legal && <div><dt className="eyebrow">Formatos</dt><dd className="mt-1 text-sm text-white">{[set.legal.standard && "Standard", set.legal.expanded && "Expanded"].filter(Boolean).join(" · ") || "—"}</dd></div>}
          </dl>
        </div>
        {set.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={assetPng(set.logo)!} alt={`Logo ${set.name}`} className="max-h-36 max-w-[320px] object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,.5)]" />
        )}
      </header>
      <SetCards set={set} />
    </div>
  );
}
