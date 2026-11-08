import { TYPES, TYPE_META } from "@/lib/constants";
import { defenseProfile } from "@/lib/typeChart";
import type { TypeName } from "@/lib/types";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { TypeIcon } from "@/components/ui/TypeIcon";

const label = (m: number) => (m === 0 ? "0" : m === 0.25 ? "¼" : m === 0.5 ? "½" : m === 1 ? "" : `${m}`);

export function TypeMatchups({ types }: { types: TypeName[] }) {
  const p = defenseProfile(types);
  const groups: [string, TypeName[], string][] = [
    ["Fraqueza 4×", p.weak4, "text-red-300"],
    ["Fraqueza 2×", p.weak2, "text-orange-200"],
    ["Resiste ½", p.resist2, "text-emerald-200"],
    ["Resiste ¼", p.resist4, "text-emerald-300"],
    ["Imune", p.immune, "text-sky-200"],
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {groups.filter(([, list]) => list.length).map(([title, list, cls]) => (
          <div key={title} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className={`eyebrow mb-3 ${cls}`}>{title}</p>
            <div className="flex flex-wrap gap-1.5">
              {list.map((t) => <TypeBadge key={t} type={t} size="sm" />)}
            </div>
          </div>
        ))}
      </div>
      <div>
        <p className="eyebrow mb-3">Dano recebido por tipo de ataque</p>
        <div className="grid grid-cols-6 gap-1 sm:grid-cols-9">
          {TYPES.map((t) => {
            const m = p.map[t];
            const bg = m === 0 ? "#1d2c3a" : m > 1 ? (m >= 4 ? "#7a1f1f" : "#5a2d17") : m < 1 ? "#173d2a" : "rgba(255,255,255,.03)";
            return (
              <div key={t} title={`${TYPE_META[t].pt}: ${m}×`} className="flex flex-col items-center gap-1 rounded-md py-2" style={{ background: bg }}>
                <span style={{ color: TYPE_META[t].color }}><TypeIcon type={t} size={14} /></span>
                <span className="font-mono text-[11px] text-white/80">{label(m) || "1"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
