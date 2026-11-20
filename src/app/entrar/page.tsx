import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { authConfigured, devAuth, getViewer } from "@/server/auth";
import { SignInForm } from "@/components/social/SignInForm";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/comunidade";
  if (await getViewer()) redirect(safeNext);

  return (
    <div className="relative isolate mx-auto flex min-h-[90vh] max-w-[1440px] items-center px-4 pt-24 md:px-6">
      <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(50% 50% at 70% 40%, rgb(255 122 47 / .16), transparent 70%), radial-gradient(40% 40% at 20% 80%, rgb(217 181 106 / .1), transparent 70%)" }} />
      <div className="grid w-full items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="eyebrow">PokéDeck Comunidade</p>
          <h1 className="display mt-4 text-[56px] text-white md:text-[96px]">
            Sua coleção, <em className="italic text-[var(--accent)]">conectada.</em>
          </h1>
          <ul className="mt-6 max-w-md space-y-2 text-sm text-white/60">
            <li>· Cadastre suas cartas e o que você procura.</li>
            <li>· Receba matches com colecionadores que têm o que você quer.</li>
            <li>· Publique decks, siga treinadores e exiba sua coleção.</li>
          </ul>
          <p className="mt-6 max-w-md text-[11px] leading-relaxed text-white/35">
            O PokéDeck aproxima colecionadores. Negociações e trocas físicas acontecem por conta e responsabilidade dos usuários —
            não há pagamentos, frete ou intermediação.
          </p>
        </div>
        <SignInForm next={safeNext} configured={authConfigured} dev={devAuth} />
      </div>
    </div>
  );
}
