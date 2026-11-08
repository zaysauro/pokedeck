"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { collection, decodeShare } from "@/hooks/useCollection";
import { useMembers } from "@/hooks/useMembers";
import { FanDeck } from "@/components/deck/FanDeck";
import { EmptyState } from "@/components/ui/EmptyState";
import { TeamAnalysis } from "./TeamAnalysis";

export function SharedDeck({ code }: { code: string }) {
  const router = useRouter();
  const team = useMemo(() => (code ? decodeShare(code) : null), [code]);
  const { members } = useMembers(team?.members ?? []);
  const [selected, setSelected] = useState<number | null>(null);

  if (!team) {
    return (
      <div className="pt-40">
        <EmptyState title="Link inválido" body="Este link de deck está incompleto ou corrompido." action={<Link href="/teams" className="rounded-full bg-white px-4 py-2 text-sm text-ink">Ir para My Decks</Link>} />
      </div>
    );
  }

  return (
    <div className="pt-32">
      <p className="eyebrow">Deck compartilhado</p>
      <h1 className="display mt-2 text-6xl md:text-8xl">{team.name}</h1>
      {team.description && <p className="mt-3 max-w-2xl text-white/55">{team.description}</p>}
      <div className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.02] px-2 pt-10">
        <FanDeck members={members} selected={selected} onSelect={setSelected} />
      </div>
      <button
        type="button"
        onClick={() => {
          const t = collection.createTeam(team);
          router.push(`/teams/${t.id}`);
        }}
        className="mt-6 flex h-11 items-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[var(--on-accent)]"
      >
        <Download size={15} /> Salvar na minha coleção
      </button>
      <div className="mt-16">
        <TeamAnalysis members={members} />
      </div>
    </div>
  );
}
