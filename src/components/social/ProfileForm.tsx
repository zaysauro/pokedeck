"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, MapPin, Search } from "lucide-react";
import { saveProfileAction } from "@/app/actions/social";
import { refreshSession } from "@/hooks/useSession";
import { searchEntries, usePokedex } from "@/hooks/usePokedex";
import type { Profile } from "@/lib/social/types";
import { toast } from "@/components/ui/Toast";
import { Avatar } from "./Avatar";

const UF = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const QUICK = [25, 6, 94, 133, 448, 658, 150, 384, 700, 887, 1, 4, 7, 197, 282];
const field = "h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[var(--accent)]";

export function ProfileForm({ initial, email, next }: { initial: Profile | null; email: string | null; next: string | null }) {
  const router = useRouter();
  const [f, setF] = useState({
    username: initial?.username ?? "",
    display_name: initial?.display_name ?? "",
    avatar_dex: initial?.avatar_dex ?? 25,
    bio: initial?.bio ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    collection_public: initial?.collection_public ?? true,
    show_location: initial?.show_location ?? true,
  });
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { entries } = usePokedex();
  const results = useMemo(() => (q ? searchEntries(entries, q, 18).map((e) => e.id) : QUICK), [entries, q]);
  const set = (patch: Partial<typeof f>) => setF((s) => ({ ...s, ...patch }));

  return (
    <form
      className="grid gap-8 lg:grid-cols-[320px_1fr]"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const r = await saveProfileAction({ ...f, username: f.username.trim().toLowerCase() });
        setBusy(false);
        if (!r.ok) return setError(r.error);
        await refreshSession();
        toast(initial ? "Perfil atualizado" : "Perfil criado! Bem-vindo, treinador.");
        if (next) router.push(next);
        else router.refresh();
      }}
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-ink-2 p-6 text-center">
          <Avatar dex={f.avatar_dex} size={128} />
          <p className="display mt-4 text-3xl">{f.display_name || (f.username ? `@${f.username}` : "Treinador")}</p>
          {email && <p className="mt-1 text-[11px] text-white/35">{email} · privado</p>}
        </div>
        <div className="rounded-3xl border border-white/10 bg-ink-2 p-4">
          <p className="eyebrow mb-3">Avatar</p>
          <label className="flex h-10 items-center gap-2 rounded-full border border-white/10 px-3">
            <Search size={14} className="text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar Pokémon" className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" aria-label="Buscar Pokémon para o avatar" />
          </label>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {results.map((id) => (
              <button key={id} type="button" onClick={() => set({ avatar_dex: id })} aria-pressed={f.avatar_dex === id} aria-label={`Avatar #${id}`} className={`relative rounded-full transition ${f.avatar_dex === id ? "ring-2 ring-[var(--accent)]" : "hover:ring-2 hover:ring-white/20"}`}>
                <Avatar dex={id} size={48} ring={false} />
                {f.avatar_dex === id && <Check size={12} className="absolute -right-0.5 -top-0.5 rounded-full bg-[var(--accent)] p-0.5 text-[var(--on-accent)]" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-5 rounded-3xl border border-white/10 bg-ink-2 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="eyebrow">Nome de usuário *</span>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">@</span>
              <input required minLength={3} maxLength={20} pattern="[a-z0-9_]{3,20}" className={`${field} pl-8 lowercase`} value={f.username} onChange={(e) => set({ username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })} placeholder="ash_ketchum" />
            </div>
            <span className="mt-1 block text-[11px] text-white/35">3–20 caracteres: letras, números e _. Será sua URL pública.</span>
          </label>
          <label>
            <span className="eyebrow">Nome de exibição</span>
            <input maxLength={40} className={`${field} mt-2`} value={f.display_name} onChange={(e) => set({ display_name: e.target.value })} placeholder="Como quer ser chamado" />
          </label>
        </div>
        <label className="block">
          <span className="eyebrow">Biografia</span>
          <textarea maxLength={280} rows={3} className={`${field} mt-2 h-auto resize-none py-3`} value={f.bio} onChange={(e) => set({ bio: e.target.value })} placeholder="Coleciona desde Base Set? Joga Standard? Conte para a comunidade." />
          <span className="mt-1 block text-right font-mono text-[10px] text-white/30">{f.bio.length}/280</span>
        </label>
        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <label>
            <span className="eyebrow flex items-center gap-1.5"><MapPin size={11} /> Cidade (opcional)</span>
            <input maxLength={60} className={`${field} mt-2`} value={f.city} onChange={(e) => set({ city: e.target.value })} placeholder="São Paulo" />
          </label>
          <label>
            <span className="eyebrow">UF</span>
            <select className={`${field} mt-2 [&>option]:bg-ink-2`} value={f.state} onChange={(e) => set({ state: e.target.value })}>
              <option value="">—</option>
              {UF.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle on={f.collection_public} onChange={(v) => set({ collection_public: v })} title="Coleção pública" hint="Outros treinadores podem ver sua vitrine de cartas (sem suas observações pessoais)." />
          <Toggle on={f.show_location} onChange={(v) => set({ show_location: v })} title="Mostrar localização" hint="Exibe cidade/UF no perfil e nos matches para facilitar trocas presenciais." />
        </div>
        <p className="text-[11px] leading-relaxed text-white/35">
          Suas cartas “disponíveis para troca” e “procurando” aparecem no seu perfil e alimentam os matches, mesmo com a coleção privada.
          Seu e-mail nunca é exibido.
        </p>
        {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
        <button disabled={busy} className="h-12 rounded-full bg-[var(--accent)] px-8 text-sm font-medium text-[var(--on-accent)] transition hover:brightness-110 disabled:opacity-50">
          {busy ? "Salvando…" : initial ? "Salvar alterações" : "Criar perfil"}
        </button>
      </div>
    </form>
  );
}

function Toggle({ on, onChange, title, hint }: { on: boolean; onChange: (v: boolean) => void; title: string; hint: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={() => onChange(!on)} className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${on ? "border-[var(--accent)]/50 bg-[var(--accent)]/[0.06]" : "border-white/10"}`}>
      {on ? <Eye size={16} className="mt-0.5 text-[var(--accent)]" /> : <EyeOff size={16} className="mt-0.5 text-white/40" />}
      <span>
        <span className="block text-sm text-white">{title}: {on ? "sim" : "não"}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-white/45">{hint}</span>
      </span>
    </button>
  );
}
