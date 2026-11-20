import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireViewer } from "@/server/auth";
import { getMyProfile } from "@/server/trading";
import { getDeck } from "@/server/community";
import { DeckEditor } from "@/components/social/DeckEditor";

export const metadata: Metadata = { title: "Editar deck TCG", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function EditTcgDeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireViewer(`/decks-tcg/${id}`);
  if (!(await getMyProfile(viewer.id))) redirect(`/conta?novo=1&next=/decks-tcg/${id}`);
  const deck = id === "novo" ? null : await getDeck(viewer.id, id);
  if (id !== "novo" && (!deck || deck.user_id !== viewer.id)) notFound();
  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-28 md:px-6 md:pt-32">
      <Link href="/decks-tcg" className="eyebrow inline-flex items-center gap-2 hover:text-white"><ArrowLeft size={12} /> Meus decks TCG</Link>
      <h1 className="display mb-8 mt-4 text-[48px] md:text-[72px]">{deck ? "Editar" : "Novo"} <em className="italic text-[var(--accent)]">deck</em></h1>
      <DeckEditor deck={deck} />
    </div>
  );
}
