import {
  Bug, Circle, Cog, Droplet, Flame, Ghost, Gem, Leaf, Moon, Mountain, Snowflake, Sparkles,
  Swords, Wind, Zap, Skull, Eye, Shell, type LucideIcon,
} from "lucide-react";
import type { TypeName } from "@/lib/types";

const ICONS: Record<TypeName, LucideIcon> = {
  normal: Circle, fire: Flame, water: Droplet, electric: Zap, grass: Leaf, ice: Snowflake,
  fighting: Swords, poison: Skull, ground: Mountain, flying: Wind, psychic: Eye, bug: Bug,
  rock: Gem, ghost: Ghost, dragon: Shell, dark: Moon, steel: Cog, fairy: Sparkles,
};

export function TypeIcon({ type, size = 12, className }: { type: TypeName; size?: number; className?: string }) {
  const Icon = ICONS[type] ?? Circle;
  return <Icon size={size} strokeWidth={2.25} className={className} aria-hidden />;
}
