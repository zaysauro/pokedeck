import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireViewer } from "@/server/auth";
import { AppError } from "@/server/db";
import { getMatch, listMessages } from "@/server/trading";
import { Chat } from "@/components/social/Chat";

export const metadata: Metadata = { title: "Conversa", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = Number(id);
  if (!Number.isInteger(matchId) || matchId <= 0) notFound();
  const viewer = await requireViewer(`/mensagens/${id}`);
  const data = await Promise.all([getMatch(viewer.id, matchId), listMessages(viewer.id, matchId)]).catch((e) => {
    if (e instanceof AppError && e.code === "NOT_FOUND") return null;
    throw e;
  });
  if (!data) notFound();
  const [match, messages] = data;
  return <Chat me={viewer.id} match={match} initial={messages} />;
}
