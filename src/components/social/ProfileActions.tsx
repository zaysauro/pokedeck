"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban, Heart, Pencil, Share2, UserCheck, UserPlus } from "lucide-react";
import { blockUserAction, followAction, likeCollectionAction } from "@/app/actions/social";
import { copyText } from "@/lib/download";
import { toast } from "@/components/ui/Toast";
import { ReportButton } from "./ReportButton";

/** Follow / like collection / share / block / report. Following never opens a trade conversation. */
export function ProfileActions(p: {
  userId: string; username: string; me: boolean; signedIn: boolean; following: boolean; liked: boolean;
  collectionPublic: boolean; blocked: boolean; iBlocked: boolean; collectionLikes: number;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(p.following);
  const [liked, setLiked] = useState(p.liked);
  const auth = () => router.push(`/entrar?next=${encodeURIComponent(`/u/${p.username}`)}`);

  const share = async () => {
    const url = `${location.origin}/u/${p.username}`;
    toast((await copyText(url)) ? "Link do perfil copiado" : "Não foi possível copiar");
  };

  if (p.me) {
    return (
      <div className="flex flex-wrap gap-2">
        <Link href="/conta" className="flex h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-sm text-white/80 hover:border-white/40"><Pencil size={14} /> Editar perfil</Link>
        <Link href="/colecao" className="flex h-11 items-center gap-2 rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-[var(--on-accent)]">Minha Coleção</Link>
        <button type="button" onClick={share} aria-label="Compartilhar perfil" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white/70 hover:text-white"><Share2 size={15} /></button>
      </div>
    );
  }
  if (p.blocked) {
    return <p className="text-xs text-white/40">{p.iBlocked ? "Você bloqueou este treinador." : "Interações indisponíveis."}</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={async () => {
          if (!p.signedIn) return auth();
          setFollowing(!following);
          const r = await followAction(p.userId, !following);
          if (!r.ok) {
            setFollowing(following);
            toast(r.error, "warn");
          } else router.refresh();
        }}
        className={`flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium transition ${following ? "border border-white/20 text-white" : "bg-[var(--accent)] text-[var(--on-accent)] hover:brightness-110"}`}
      >
        {following ? <><UserCheck size={15} /> Seguindo</> : <><UserPlus size={15} /> Seguir</>}
      </button>
      {p.collectionPublic && (
        <button
          type="button"
          aria-pressed={liked}
          onClick={async () => {
            if (!p.signedIn) return auth();
            setLiked(!liked);
            const r = await likeCollectionAction(p.userId, !liked);
            if (!r.ok) {
              setLiked(liked);
              toast(r.error, "warn");
            } else router.refresh();
          }}
          className={`flex h-11 items-center gap-2 rounded-full border px-4 text-sm transition ${liked ? "border-[#ff4d6d] bg-[#ff4d6d]/15 text-[#ff8fa3]" : "border-white/15 text-white/80 hover:border-white/40"}`}
        >
          <Heart size={15} fill={liked ? "currentColor" : "none"} /> Curtir coleção
        </button>
      )}
      <button type="button" onClick={share} aria-label="Compartilhar perfil" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white/70 hover:text-white"><Share2 size={15} /></button>
      {p.signedIn && (
        <>
          <button
            type="button"
            onClick={async () => {
              if (!confirm(`Bloquear @${p.username}? Vocês deixam de se seguir e não terão matches nem mensagens.`)) return;
              const r = await blockUserAction(p.userId);
              if (!r.ok) return toast(r.error, "warn");
              toast("Usuário bloqueado");
              router.refresh();
            }}
            className="flex h-9 items-center gap-1.5 rounded-full border border-white/10 px-3 text-xs text-white/50 hover:border-red-400/40 hover:text-red-300"
          >
            <Ban size={13} /> Bloquear
          </button>
          <ReportButton type="user" id={p.userId} />
        </>
      )}
    </div>
  );
}
