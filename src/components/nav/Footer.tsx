import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-white/10 bg-ink pb-28 pt-16 lg:pb-12">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 md:grid-cols-[2fr_1fr_1fr] md:px-6">
        <div>
          <Logo />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/50">
            Uma Pokédex colecionável e um construtor de decks. Dados de{" "}
            <a className="underline decoration-white/20 underline-offset-4 hover:text-white" href="https://pokeapi.co" target="_blank" rel="noreferrer">PokéAPI</a>{" "}
            e imagens de{" "}
            <a className="underline decoration-white/20 underline-offset-4 hover:text-white" href="https://github.com/PokeAPI/sprites" target="_blank" rel="noreferrer">PokeAPI/sprites</a>.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-white/55">
          <span className="eyebrow mb-2">Navegar</span>
          <Link href="/pokedex" className="hover:text-white">Pokédex</Link>
          <Link href="/teams" className="hover:text-white">My Decks</Link>
          <Link href="/favorites" className="hover:text-white">Favoritos</Link>
          <Link href="/compare" className="hover:text-white">Comparar</Link>
        </div>
        <p className="text-xs leading-relaxed text-white/35">
          Projeto de fã, sem fins lucrativos e sem afiliação com Nintendo, Game Freak ou The Pokémon Company.
          Pokémon e seus nomes são marcas registradas de seus respectivos donos.
        </p>
      </div>
    </footer>
  );
}
