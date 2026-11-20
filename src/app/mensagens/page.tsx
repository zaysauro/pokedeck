import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { requireViewer } from "@/server/auth";
import { getMyProfile, listMatches } from "@/server/trading";
import { Container, PageHeader } from "@/components/ui/PageHeader";
import { Avatar, displayName } from "@/components/social/Avatar";

export const metadata: Metadata = { title: "Mensagens", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const viewer = await requireViewer("/mensagens");
  if (!(await getMyProfile(viewer.id))) redirect("/conta?novo=1&next=/mensagens");
  const matches = await listMatches(viewer.id);
  const convos = matches.filter((m) => m.status === "open" || m.last_message_at);

  return (
    <Container className="pb-10">
      <PageHeader eyebrow="Mensagens" title="Conversas de" italic="troca.">
        Conversas só existem entre colecionadores com um match válido. Combine os detalhes com segurança: o PokéDeck não intermedeia trocas.
      </PageHeader>
      {convos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center">
          <MessageCircle className="mx-auto text-white/30" />
          <p className="mt-3 text-sm text-white/50">Nenhuma conversa ainda. Quando surgir um match em <Link href="/trocas" className="underline">Trocas</Link>, você poderá conversar.</p>
        </div>
      ) : (
        <ul className="divide-y divide-white/5 overflow-hidden rounded-3xl border border-white/10 bg-ink-2">
          {convos.map((m) => (
            <li key={m.id}>
              <Link href={`/mensagens/${m.id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-white/[0.03]">
                <Avatar dex={m.other.avatar_dex} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-white">{displayName(m.other)}</span>
                  <span className="block truncate text-xs text-white/40">
                    {m.cards.map((c) => c.card_name).slice(0, 3).join(" · ") || "Match"}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-mono text-[10px] text-white/35">
                    {m.status !== "open" ? (m.status === "closed" ? "Encerrada" : "Expirada") : m.last_message_at ? new Date(m.last_message_at).toLocaleDateString("pt-BR") : "Nova"}
                  </span>
                  {m.unread > 0 && <span className="mt-1 inline-block rounded-full bg-[var(--accent)] px-2 font-mono text-[10px] text-[var(--on-accent)]">{m.unread}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
