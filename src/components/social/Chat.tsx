"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, Ban, Info, MapPin, Send, ShieldAlert, X } from "lucide-react";
import { blockUserAction, closeMatchAction, sendMessageAction } from "@/app/actions/social";
import type { MatchSummary, Message } from "@/lib/social/types";
import { refreshSession } from "@/hooks/useSession";
import { toast } from "@/components/ui/Toast";
import { Avatar, displayName } from "./Avatar";
import { Thumb } from "./CollectionManager";
import { ReportButton } from "./ReportButton";

const POLL_MS = 4000;
const TEMPLATE = "Oi! Vi que temos um match no PokéDeck. Tenho algumas cartas que podem te interessar — vamos negociar?";

/** Trade conversation. Neon has no push channel, so new messages are polled every few seconds while visible. */
export function Chat({ me, match, initial }: { me: string; match: MatchSummary & { blocked: boolean; closed_by: string | null }; initial: Message[] }) {
  const router = useRouter();
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState(initial.length ? "" : TEMPLATE);
  const [refs, setRefs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const lastId = useRef(initial.at(-1)?.id ?? 0);
  const open = match.status === "open" && !match.blocked;
  const cardById = new Map(match.cards.map((c) => [c.card_id, c]));

  useLayoutEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  useEffect(() => {
    void refreshSession();
    if (!open) return;
    const t = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      const r = await fetch(`/api/social/messages?match=${match.id}&after=${lastId.current}`, { cache: "no-store" }).then((x) => x.json()).catch(() => null);
      const fresh = (r?.messages ?? []) as Message[];
      if (fresh.length) {
        lastId.current = fresh.at(-1)!.id;
        setMessages((m) => [...m, ...fresh.filter((f) => !m.some((x) => x.id === f.id))]);
      }
    }, POLL_MS);
    return () => clearInterval(t);
  }, [match.id, open]);

  const send = async () => {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    const r = await sendMessageAction(match.id, body, refs);
    setBusy(false);
    if (!r.ok) return toast(r.error, "warn");
    lastId.current = Math.max(lastId.current, r.data.id);
    setMessages((m) => [...m, r.data]);
    setText("");
    setRefs([]);
  };

  return (
    <div className="mx-auto grid max-w-[1200px] gap-6 px-4 pb-6 pt-24 md:px-6 lg:grid-cols-[1fr_320px]">
      <section className="flex h-[calc(100svh-8rem)] min-h-[480px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-ink-2 lg:h-[calc(100svh-7.5rem)]">
        <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <Link href="/mensagens" aria-label="Voltar" className="text-white/50 hover:text-white"><ArrowLeft size={18} /></Link>
          <Avatar dex={match.other.avatar_dex} size={36} />
          <div className="min-w-0 flex-1">
            <Link href={`/u/${match.other.username}`} className="block truncate text-sm text-white hover:underline">{displayName(match.other)}</Link>
            <p className="truncate text-[11px] text-white/40">{match.kind === "mutual" ? "Match mútuo" : "Oportunidade de troca"} · @{match.other.username}</p>
          </div>
        </header>

        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
          <p className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-center text-[11px] leading-relaxed text-white/45">
            <ShieldAlert size={13} className="mr-1 inline text-gold" />
            Nunca compartilhe senhas ou dados bancários. O PokéDeck não intermedeia pagamentos, envios ou garantias — combine trocas com cuidado.
          </p>
          {messages.map((m) => {
            const mine = m.sender_id === me;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`group max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${mine ? "rounded-br-md bg-[var(--accent)] text-[var(--on-accent)]" : "rounded-bl-md bg-white/[0.07] text-white"}`}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  {m.card_refs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.card_refs.map((id) => {
                        const c = cardById.get(id);
                        return (
                          <Link key={id} href={`/cards/${encodeURIComponent(id)}`} className={`flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[11px] ${mine ? "bg-black/15" : "bg-white/10"}`}>
                            <Thumb src={c?.card_image ?? null} alt="" w={18} /> {c?.card_name ?? id}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                  <p className={`mt-1 flex items-center gap-2 text-[9px] ${mine ? "text-black/50" : "text-white/35"}`}>
                    {new Date(m.created_at).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                    {!mine && <span className="opacity-0 transition group-hover:opacity-100"><ReportButton type="message" id={String(m.id)} label="Denunciar" compact /></span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {open ? (
          <form className="border-t border-white/10 p-3" onSubmit={(e) => { e.preventDefault(); void send(); }}>
            {refs.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {refs.map((id) => (
                  <button key={id} type="button" onClick={() => setRefs((r) => r.filter((x) => x !== id))} className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/80">
                    {cardById.get(id)?.card_name ?? id} <X size={10} />
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
                maxLength={2000}
                rows={2}
                placeholder="Escreva uma mensagem…"
                aria-label="Mensagem"
                className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl border border-white/10 bg-ink px-4 py-2.5 text-sm outline-none focus:border-white/30"
              />
              <button disabled={busy || !text.trim()} aria-label="Enviar" className="grid h-11 w-11 place-items-center rounded-full bg-[var(--accent)] text-[var(--on-accent)] disabled:opacity-40"><Send size={16} /></button>
            </div>
          </form>
        ) : (
          <p className="flex items-center justify-center gap-2 border-t border-white/10 px-4 py-4 text-center text-xs text-white/45">
            <Info size={13} /> {match.blocked ? "Conversa indisponível." : match.status === "closed" ? "Esta conversa foi encerrada." : "Este match expirou: as cartas não estão mais disponíveis."}
          </p>
        )}
      </section>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-white/10 bg-ink-2 p-5">
          <p className="eyebrow mb-3">Cartas do match</p>
          {match.cards.length === 0 && <p className="text-xs text-white/40">As cartas deste match não estão mais disponíveis.</p>}
          <ul className="space-y-2">
            {match.cards.map((c) => (
              <li key={`${c.card_id}-${c.direction}-${c.language}`} className="flex items-center gap-2.5">
                <Thumb src={c.card_image} alt={c.card_name} w={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs text-white">{c.card_name}</span>
                  <span className={`text-[10px] ${c.direction === "give" ? "text-[var(--accent)]" : "text-emerald-300"}`}>{c.direction === "give" ? "Você oferece" : "Você recebe"} · {c.language}</span>
                </span>
                {open && (
                  <button type="button" onClick={() => setRefs((r) => (r.includes(c.card_id) ? r : [...r, c.card_id].slice(0, 6)))} className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/60 hover:text-white">Citar</button>
                )}
              </li>
            ))}
          </ul>
          {match.other.city && <p className="mt-4 flex items-center gap-1 text-[11px] text-white/40"><MapPin size={11} /> {match.other.city}{match.other.state ? `/${match.other.state}` : ""}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {match.status === "open" && (
            <button type="button" onClick={async () => {
              if (!confirm("Encerrar este match? Vocês não poderão mais trocar mensagens nesta conversa.")) return;
              const r = await closeMatchAction(match.id);
              if (!r.ok) return toast(r.error, "warn");
              toast("Match encerrado");
              router.refresh();
            }} className="flex h-9 items-center gap-1.5 rounded-full border border-white/10 px-3 text-xs text-white/60 hover:text-white">
              <X size={13} /> Encerrar match
            </button>
          )}
          {!match.blocked && (
            <button type="button" onClick={async () => {
              if (!confirm(`Bloquear @${match.other.username}? Vocês não terão mais matches, mensagens ou interações.`)) return;
              const r = await blockUserAction(match.other.user_id);
              if (!r.ok) return toast(r.error, "warn");
              toast("Usuário bloqueado");
              router.push("/trocas");
            }} className="flex h-9 items-center gap-1.5 rounded-full border border-white/10 px-3 text-xs text-white/60 hover:border-red-400/40 hover:text-red-300">
              <Ban size={13} /> Bloquear
            </button>
          )}
          <ReportButton type="user" id={match.other.user_id} />
        </div>
      </aside>
    </div>
  );
}
