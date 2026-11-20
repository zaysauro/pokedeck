"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CornerDownRight, Pencil, Trash2 } from "lucide-react";
import { addCommentAction, deleteCommentAction, editCommentAction } from "@/app/actions/social";
import type { CommentRow } from "@/lib/social/types";
import { toast } from "@/components/ui/Toast";
import { Avatar, displayName } from "./Avatar";
import { ReportButton } from "./ReportButton";
import { timeAgo } from "@/lib/social/time";

/** Comments with one level of replies; authors can edit and delete their own. */
export function Comments({ deckId, initial, me }: { deckId: string; initial: CommentRow[]; me: string | null }) {
  const router = useRouter();
  const roots = initial.filter((c) => !c.parent_id);
  const replies = (id: number) => initial.filter((c) => c.parent_id === id);

  const submit = async (body: string, parent: number | null) => {
    const r = await addCommentAction(deckId, body, parent);
    if (!r.ok) {
      toast(r.error, "warn");
      return false;
    }
    router.refresh();
    return true;
  };

  return (
    <div className="space-y-6">
      {me ? (
        <Composer onSubmit={(b) => submit(b, null)} placeholder="Comente sobre o deck, a estratégia ou as cartas…" />
      ) : (
        <p className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/55">
          <Link href={`/entrar?next=${encodeURIComponent(`/d/${deckId}`)}`} className="text-[var(--accent)] underline-offset-4 hover:underline">Entre</Link> para comentar.
        </p>
      )}
      {roots.length === 0 && <p className="text-sm text-white/40">Seja o primeiro a comentar.</p>}
      <ul className="space-y-5">
        {roots.map((c) => (
          <li key={c.id}>
            <CommentItem c={c} me={me} deckId={deckId} onReply={(b) => submit(b, c.id)} />
            {replies(c.id).length > 0 && (
              <ul className="ml-10 mt-3 space-y-3 border-l border-white/10 pl-4">
                {replies(c.id).map((r) => <li key={r.id}><CommentItem c={r} me={me} deckId={deckId} /></li>)}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CommentItem({ c, me, deckId, onReply }: { c: CommentRow; me: string | null; deckId: string; onReply?: (b: string) => Promise<boolean> }) {
  const router = useRouter();
  const [mode, setMode] = useState<null | "edit" | "reply">(null);
  const mine = me === c.author.user_id;

  if (c.deleted) return <p className="text-xs italic text-white/30">Comentário removido.</p>;
  return (
    <div className="flex gap-3">
      <Link href={`/u/${c.author.username}`}><Avatar dex={c.author.avatar_dex} size={32} /></Link>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-white/45">
          <Link href={`/u/${c.author.username}`} className="text-white/85 hover:underline">{displayName(c.author)}</Link> · {timeAgo(c.created_at)}
          {c.edited_at && " · editado"}
        </p>
        {mode === "edit" ? (
          <Composer
            initial={c.body}
            submitLabel="Salvar"
            onCancel={() => setMode(null)}
            onSubmit={async (b) => {
              const r = await editCommentAction(deckId, c.id, b);
              if (!r.ok) {
                toast(r.error, "warn");
                return false;
              }
              setMode(null);
              router.refresh();
              return true;
            }}
          />
        ) : (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-white/80">{c.body}</p>
        )}
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-white/35">
          {onReply && me && mode !== "reply" && (
            <button type="button" onClick={() => setMode("reply")} className="flex items-center gap-1 hover:text-white"><CornerDownRight size={11} /> Responder</button>
          )}
          {mine && mode === null && (
            <>
              <button type="button" onClick={() => setMode("edit")} className="flex items-center gap-1 hover:text-white"><Pencil size={11} /> Editar</button>
              <button type="button" onClick={async () => {
                if (!confirm("Excluir este comentário?")) return;
                const r = await deleteCommentAction(deckId, c.id);
                if (!r.ok) return toast(r.error, "warn");
                router.refresh();
              }} className="flex items-center gap-1 hover:text-red-300"><Trash2 size={11} /> Excluir</button>
            </>
          )}
          {me && !mine && <ReportButton type="comment" id={String(c.id)} compact />}
        </div>
        {mode === "reply" && onReply && (
          <div className="mt-2">
            <Composer placeholder={`Responder ${displayName(c.author)}…`} submitLabel="Responder" onCancel={() => setMode(null)} onSubmit={async (b) => {
              const ok = await onReply(b);
              if (ok) setMode(null);
              return ok;
            }} />
          </div>
        )}
      </div>
    </div>
  );
}

function Composer({ onSubmit, placeholder, initial = "", submitLabel = "Comentar", onCancel }: { onSubmit: (b: string) => Promise<boolean>; placeholder?: string; initial?: string; submitLabel?: string; onCancel?: () => void }) {
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-1"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        setBusy(true);
        const ok = await onSubmit(text);
        setBusy(false);
        if (ok && !initial) setText("");
      }}
    >
      <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} rows={2} placeholder={placeholder} aria-label="Comentário" className="w-full resize-none rounded-2xl border border-white/10 bg-ink-2 px-4 py-3 text-sm outline-none focus:border-white/30" />
      <div className="mt-2 flex items-center justify-end gap-2">
        <span className="mr-auto font-mono text-[10px] text-white/25">{text.length}/1000</span>
        {onCancel && <button type="button" onClick={onCancel} className="h-9 rounded-full px-3 text-xs text-white/50 hover:text-white">Cancelar</button>}
        <button disabled={busy || !text.trim()} className="h-9 rounded-full bg-white px-4 text-xs text-ink disabled:opacity-40">{busy ? "Enviando…" : submitLabel}</button>
      </div>
    </form>
  );
}
