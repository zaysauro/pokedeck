import { TCG_TYPE_TO_POKEDEX, tcgTypeColor } from "@/lib/tcg/constants";
import { TypeIcon } from "@/components/ui/TypeIcon";

/** Energy symbol: a coloured disc with the matching PokéDeck type icon. */
export function Energy({ type, size = 20 }: { type: string; size?: number }) {
  const t = TCG_TYPE_TO_POKEDEX[type];
  return (
    <span
      title={type}
      aria-label={type}
      role="img"
      className="inline-grid shrink-0 place-items-center rounded-full text-[#0c0c0c] shadow-[inset_0_-2px_0_rgba(0,0,0,.25),0_0_0_1.5px_rgba(0,0,0,.4)]"
      style={{ width: size, height: size, background: tcgTypeColor(type) }}
    >
      {t ? <TypeIcon type={t} size={Math.round(size * 0.6)} /> : <span className="text-[9px] font-bold">{type.slice(0, 1)}</span>}
    </span>
  );
}

export function EnergyCost({ cost, size }: { cost?: string[]; size?: number }) {
  if (!cost?.length) return <span className="font-mono text-[10px] text-white/30">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {cost.map((c, i) => <Energy key={i} type={c} size={size} />)}
    </span>
  );
}

export function TcgTypePill({ type }: { type: string }) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-[5px] pl-1 pr-2.5 font-mono text-[11px] uppercase tracking-wider" style={{ background: `color-mix(in oklab, ${tcgTypeColor(type)} 16%, transparent)`, color: tcgTypeColor(type), boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${tcgTypeColor(type)} 40%, transparent)` }}>
      <Energy type={type} size={18} /> {type}
    </span>
  );
}
