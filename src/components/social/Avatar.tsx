import { spriteUrl } from "@/lib/sprites";

/** Trainer avatar: an official Pokémon artwork inside a ring (no photo uploads to moderate). */
export function Avatar({ dex, size = 40, className = "", ring = true }: { dex: number; size?: number; className?: string; ring?: boolean }) {
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_35%,#2b2b33,#121215)] ${ring ? "ring-1 ring-white/15" : ""} ${className}`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={spriteUrl(dex, "artwork")} alt="" loading="lazy" className="h-[86%] w-[86%] object-contain" />
    </span>
  );
}

export function displayName(p: { username: string; display_name?: string | null }) {
  return p.display_name || `@${p.username}`;
}
