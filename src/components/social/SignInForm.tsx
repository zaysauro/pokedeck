"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { refreshSession } from "@/hooks/useSession";
import { devSignInAction } from "@/app/actions/social";

const inputCls =
  "h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-base text-white outline-none transition placeholder:text-white/30 focus:border-[var(--accent)]";

function friendly(code?: string, message?: string) {
  if (code === "TOO_MANY_ATTEMPTS" || message?.toLowerCase().includes("too many")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (code?.includes("OTP") || message?.toLowerCase().includes("otp") || message?.toLowerCase().includes("invalid")) return "Código inválido ou expirado.";
  return message || "Não foi possível concluir. Tente novamente.";
}

export function SignInForm({ next, configured, dev }: { next: string; configured: boolean; dev: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = async () => {
    await refreshSession();
    const r = await fetch("/api/social/me", { cache: "no-store" }).then((x) => x.json()).catch(() => null);
    router.replace(r?.profile ? next : `/conta?novo=1&next=${encodeURIComponent(next)}`);
    router.refresh();
  };

  if (dev) {
    return (
      <form
        className="rounded-3xl border border-amber-300/30 bg-ink-2 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const r = await devSignInAction(email.trim().toLowerCase());
          setBusy(false);
          if (!r.ok) return setError(r.error);
          await done();
        }}
      >
        <p className="eyebrow !text-amber-200">Modo desenvolvimento</p>
        <p className="mt-2 text-sm text-white/60">Entre como um usuário de teste (apenas localmente).</p>
        <input className={`${inputCls} mt-4`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ex.: bruno" aria-label="Id de teste" />
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <button disabled={busy || !email} className="mt-4 h-12 w-full rounded-xl bg-[var(--accent)] text-sm font-medium text-[var(--on-accent)] disabled:opacity-50">Entrar</button>
      </form>
    );
  }

  if (!configured) {
    return (
      <div className="rounded-3xl border border-white/10 bg-ink-2 p-6 text-sm text-white/60">
        A área de contas ainda está sendo ativada. Volte em instantes.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-ink-2 p-6 shadow-2xl md:p-8">
      {step === "email" ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            const { error: err } = await authClient.emailOtp.sendVerificationOtp({ email: email.trim(), type: "sign-in" });
            setBusy(false);
            if (err) return setError(friendly(err.code, err.message));
            setStep("code");
          }}
        >
          <p className="flex items-center gap-2 text-sm text-white"><Mail size={16} className="text-[var(--accent)]" /> Entrar ou criar conta</p>
          <p className="mt-1 text-xs text-white/45">Enviaremos um código de acesso para o seu e-mail. Sem senha.</p>
          <label className="mt-5 block">
            <span className="eyebrow">E-mail</span>
            <input type="email" required autoComplete="email" autoFocus className={`${inputCls} mt-2`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" />
          </label>
          {error && <p className="mt-3 text-sm text-red-300" role="alert">{error}</p>}
          <button disabled={busy || !email} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-sm font-medium text-[var(--on-accent)] transition hover:brightness-110 disabled:opacity-50">
            {busy ? "Enviando…" : <>Receber código <ArrowRight size={15} /></>}
          </button>
        </form>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            const { error: err } = await authClient.signIn.emailOtp({ email: email.trim(), otp: code.trim() });
            setBusy(false);
            if (err) return setError(friendly(err.code, err.message));
            await done();
          }}
        >
          <button type="button" onClick={() => { setStep("email"); setCode(""); setError(null); }} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white">
            <ArrowLeft size={13} /> Trocar e-mail
          </button>
          <p className="mt-4 flex items-center gap-2 text-sm text-white"><ShieldCheck size={16} className="text-[var(--accent)]" /> Digite o código</p>
          <p className="mt-1 text-xs text-white/45">Enviado para <span className="text-white/80">{email}</span>. Confira também a caixa de spam.</p>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={8}
            className={`${inputCls} mt-5 text-center font-mono text-2xl tracking-[0.5em]`}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            aria-label="Código de acesso"
            placeholder="••••••"
          />
          {error && <p className="mt-3 text-sm text-red-300" role="alert">{error}</p>}
          <button disabled={busy || code.length < 4} className="mt-5 h-12 w-full rounded-xl bg-[var(--accent)] text-sm font-medium text-[var(--on-accent)] transition hover:brightness-110 disabled:opacity-50">
            {busy ? "Verificando…" : "Entrar"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const { error: err } = await authClient.emailOtp.sendVerificationOtp({ email: email.trim(), type: "sign-in" });
              setBusy(false);
              setError(err ? friendly(err.code, err.message) : "Novo código enviado.");
            }}
            className="mt-3 w-full text-center text-xs text-white/45 hover:text-white"
          >
            Reenviar código
          </button>
        </form>
      )}
    </div>
  );
}
