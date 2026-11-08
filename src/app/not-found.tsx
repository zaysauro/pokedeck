import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-sm tracking-[0.3em] text-white/40">#404</p>
      <h1 className="display mt-4 text-7xl">Carta <em className="italic text-[var(--accent)]">perdida</em></h1>
      <p className="mt-4 text-white/55">Esta página não está no deck. Talvez o Pokémon tenha fugido para o mato alto.</p>
      <Link href="/pokedex" className="mt-8 rounded-full bg-white px-5 py-2.5 text-sm text-ink">Voltar à Pokédex</Link>
    </div>
  );
}
