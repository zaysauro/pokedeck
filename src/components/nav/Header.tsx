"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { BookOpen, Compass, Grid3x3, Heart, Layers, Scale, Search, Sparkles } from "lucide-react";
import { collection, useCollection } from "@/hooks/useCollection";
import { useSearchPalette } from "./SearchPalette";
import { Logo } from "./Logo";

export const NAV = [
  { href: "/", label: "Explore", icon: Compass },
  { href: "/pokedex", label: "Pokédex", icon: Grid3x3 },
  { href: "/cards", label: "Cartas TCG", icon: BookOpen },
  { href: "/teams", label: "My Decks", icon: Layers },
  { href: "/favorites", label: "Favoritos", icon: Heart },
  { href: "/compare", label: "Comparar", icon: Scale },
];

export function Header() {
  const path = usePathname();
  const favCount = useCollection((s) => s.favorites.length);
  const teamCount = useCollection((s) => s.teams.length);
  const shiny = useCollection((s) => s.prefs.shiny);
  const openSearch = useSearchPalette((s) => s.open);

  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href) || (href === "/teams" && path.startsWith("/teams")));

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto mt-3 flex h-14 max-w-[1440px] items-center gap-3 px-4 md:px-6">
          <div className="flex h-full flex-1 items-center gap-2 rounded-full border border-white/10 bg-ink/70 pl-4 pr-2 backdrop-blur-xl md:gap-6">
            <Link href="/" aria-label="PokéDeck — início" className="shrink-0">
              <Logo />
            </Link>
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`relative rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${isActive(n.href) ? "text-white" : "text-white/55 hover:text-white"}`}
                >
                  {isActive(n.href) && (
                    <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-white/10" transition={{ type: "spring", stiffness: 400, damping: 34 }} />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    {n.label}
                    {n.href === "/favorites" && favCount > 0 && <Count n={favCount} />}
                    {n.href === "/teams" && teamCount > 0 && <Count n={teamCount} />}
                  </span>
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={openSearch}
                className="flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-[13px] text-white/60 transition hover:border-white/25 hover:text-white md:w-64"
              >
                <Search size={15} />
                <span className="hidden md:inline">Buscar Pokémon…</span>
                <kbd className="ml-auto hidden rounded border border-white/15 px-1.5 font-mono text-[10px] text-white/40 md:inline">⌘K</kbd>
              </button>
              <button
                type="button"
                onClick={() => collection.setPrefs({ shiny: !shiny })}
                aria-pressed={shiny}
                title={shiny ? "Modo Shiny ativado" : "Ativar modo Shiny"}
                className={`grid h-9 w-9 place-items-center rounded-full border transition ${shiny ? "border-gold/60 bg-gold/15 text-gold" : "border-white/10 text-white/55 hover:text-white"}`}
              >
                <Sparkles size={15} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile tab bar */}
      <nav aria-label="Principal (mobile)" className="fixed inset-x-3 bottom-3 z-50 flex justify-around rounded-2xl border border-white/10 bg-ink/85 py-1.5 backdrop-blur-xl lg:hidden">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = isActive(n.href);
          return (
            <Link key={n.href} href={n.href} className={`relative flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${active ? "text-white" : "text-white/45"}`}>
              <Icon size={18} />
              {n.label}
              {active && <motion.span layoutId="tab-dot" className="absolute -bottom-0.5 h-0.5 w-5 rounded-full bg-[var(--accent)]" />}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function Count({ n }: { n: number }) {
  return <span className="rounded-full bg-[var(--accent)] px-1.5 font-mono text-[10px] leading-4 text-[var(--on-accent)]">{n}</span>;
}
