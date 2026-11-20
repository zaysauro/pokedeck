"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeftRight, Bell, BookMarked, Layers3, LogIn, LogOut, MessageCircle, Settings, User } from "lucide-react";
import { refreshSession, useSession } from "@/hooks/useSession";
import { markNotificationsReadAction, signOutAction } from "@/app/actions/social";
import type { NotificationRow } from "@/lib/social/types";
import { Avatar, displayName } from "./Avatar";
import { timeAgo } from "@/lib/social/time";

function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && close();
    const k = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", k);
    };
  }, [open, close]);
  return ref;
}

const Badge = ({ n }: { n: number }) =>
  n > 0 ? <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-[var(--accent)] px-1 text-center font-mono text-[9px] leading-4 text-[var(--on-accent)]">{n > 99 ? "99+" : n}</span> : null;

export function AccountMenu() {
  const s = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));

  if (!s.loaded || !s.enabled) return null;
  if (!s.viewer) {
    return (
      <Link href="/entrar" className="flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-medium text-ink transition hover:bg-white/90">
        <LogIn size={14} /> <span className="hidden sm:inline">Entrar</span>
      </Link>
    );
  }
  const p = s.profile;
  const b = s.badges ?? { notifications: 0, messages: 0, matches: 0 };
  const items = [
    p && { href: `/u/${p.username}`, label: "Meu perfil", icon: User },
    { href: "/colecao", label: "Minha Coleção", icon: BookMarked },
    { href: "/trocas", label: "Trocas", icon: ArrowLeftRight, n: b.matches },
    { href: "/mensagens", label: "Mensagens", icon: MessageCircle, n: b.messages },
    { href: "/decks-tcg", label: "Meus decks TCG", icon: Layers3 },
    { href: "/conta", label: p ? "Configurações" : "Criar perfil", icon: Settings },
  ].filter(Boolean) as { href: string; label: string; icon: typeof User; n?: number }[];

  return (
    <div className="flex items-center gap-1.5">
      <Notifications count={b.notifications} />
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Menu da conta"
          className="relative grid h-9 w-9 place-items-center rounded-full transition hover:ring-2 hover:ring-white/20"
        >
          <Avatar dex={p?.avatar_dex ?? 25} size={36} />
          <Badge n={b.messages} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.16 }}
              className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-ink-2 p-1.5 shadow-2xl"
            >
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Avatar dex={p?.avatar_dex ?? 25} size={40} />
                <div className="min-w-0">
                  <p className="truncate text-sm text-white">{p ? displayName(p) : "Novo treinador"}</p>
                  <p className="truncate text-[11px] text-white/40">{p ? `@${p.username}` : s.viewer.email}</p>
                </div>
              </div>
              <div className="my-1 h-px bg-white/10" />
              {items.map((it) => (
                <Link key={it.href} href={it.href} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/[0.06] hover:text-white">
                  <it.icon size={15} className="text-white/45" />
                  <span className="flex-1">{it.label}</span>
                  {it.n ? <span className="rounded-full bg-[var(--accent)] px-1.5 font-mono text-[10px] text-[var(--on-accent)]">{it.n}</span> : null}
                </Link>
              ))}
              <div className="my-1 h-px bg-white/10" />
              <button
                type="button"
                onClick={async () => {
                  setOpen(false);
                  await signOutAction();
                  await refreshSession();
                  router.push("/");
                  router.refresh();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-white/60 hover:bg-white/[0.06] hover:text-white"
              >
                <LogOut size={15} /> Sair
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const NOTIF_TEXT: Record<NotificationRow["type"], string> = {
  follow: "começou a seguir você",
  deck_like: "curtiu seu deck",
  deck_comment: "comentou no seu deck",
  comment_reply: "respondeu seu comentário",
  collection_like: "curtiu sua coleção",
  match: "tem um match de troca com você",
  message: "enviou uma mensagem",
};

function notifHref(n: NotificationRow) {
  if (n.type === "match" || n.type === "message") return n.match_id ? `/mensagens/${n.match_id}` : "/trocas";
  if (n.deck) return `/d/${n.deck.id}`;
  return n.actor ? `/u/${n.actor.username}` : "/comunidade";
}

function Notifications({ count }: { count: number }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<NotificationRow[] | null>(null);
  const ref = useOutside(open, () => setOpen(false));

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      const r = await fetch("/api/social/notifications", { cache: "no-store" }).then((x) => x.json()).catch(() => null);
      setList(r?.notifications ?? []);
      if (count > 0) {
        await markNotificationsReadAction();
        void refreshSession();
      }
    }
  };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={toggle} aria-label={`Notificações${count ? ` (${count} novas)` : ""}`} aria-expanded={open} className="relative grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 transition hover:text-white">
        <Bell size={15} />
        <Badge n={count} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-full z-50 mt-2 w-[min(88vw,340px)] overflow-hidden rounded-2xl border border-white/10 bg-ink-2 shadow-2xl"
          >
            <p className="eyebrow border-b border-white/10 px-4 py-3">Notificações</p>
            <ul className="max-h-[60vh] overflow-y-auto p-1.5">
              {list === null && <li className="px-3 py-6 text-center text-xs text-white/40">Carregando…</li>}
              {list?.length === 0 && <li className="px-3 py-6 text-center text-xs text-white/40">Nada por aqui ainda.</li>}
              {list?.map((n) => (
                <li key={n.id}>
                  <Link href={notifHref(n)} onClick={() => setOpen(false)} className={`flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-white/[0.05] ${n.read ? "" : "bg-[var(--accent)]/[0.06]"}`}>
                    <Avatar dex={n.actor?.avatar_dex ?? 25} size={30} />
                    <span className="min-w-0 flex-1 text-[13px] leading-snug text-white/75">
                      <b className="font-medium text-white">{n.actor ? displayName(n.actor) : "Alguém"}</b> {NOTIF_TEXT[n.type]}
                      {n.deck && <> · <span className="text-white">{n.deck.title}</span></>}
                      <span className="mt-0.5 block font-mono text-[10px] text-white/35">{timeAgo(n.created_at)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
