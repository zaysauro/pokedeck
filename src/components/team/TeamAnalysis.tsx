"use client";

import { motion } from "motion/react";
import { Info, ShieldAlert, ShieldCheck, Swords, Lightbulb } from "lucide-react";
import { STAT_KEYS, STAT_LABEL, TYPES, TYPE_META } from "@/lib/constants";
import { analyzeTeam, effectiveness as eff } from "@/lib/typeChart";
import type { IndexEntry, TypeName } from "@/lib/types";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { TypeIcon } from "@/components/ui/TypeIcon";

/** Team balance overview: defensive matrix, shared weaknesses, STAB coverage and stat spread. */
export function TeamAnalysis({ members }: { members: IndexEntry[] }) {
  const typed = members.filter((m) => m.types.length);
  const a = analyzeTeam(typed.map((m) => m.types));
  if (!typed.length) {
    return <p className="text-sm text-white/45">Adicione Pokémon ao deck para ver a análise de equilíbrio.</p>;
  }
  const avg = STAT_KEYS.map((_, i) => Math.round(typed.reduce((s, m) => s + m.stats[i], 0) / typed.length));
  const maxAvg = Math.max(...avg, 1);

  return (
    <div className="space-y-10">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Panel icon={<ShieldAlert size={15} />} title="Fraquezas compartilhadas" tone="text-red-300">
          {a.sharedWeaknesses.length ? <Types list={a.sharedWeaknesses} /> : <Muted>Nenhuma fraqueza concentrada. Ótimo!</Muted>}
        </Panel>
        <Panel icon={<ShieldCheck size={15} />} title="Bem resistido" tone="text-emerald-300">
          {a.wellCovered.length ? <Types list={a.wellCovered} /> : <Muted>Poucas resistências em comum.</Muted>}
        </Panel>
        <Panel icon={<Swords size={15} />} title="Cobertura ofensiva (STAB)" tone="text-amber-200">
          <p className="mb-2 font-mono text-2xl text-white">{a.offensiveCoverage.length}<span className="text-sm text-white/40">/18 tipos</span></p>
          {a.offensiveGaps.length > 0 && (
            <>
              <p className="mb-1.5 text-[11px] text-white/45">Sem golpe super efetivo contra:</p>
              <Types list={a.offensiveGaps} />
            </>
          )}
        </Panel>
        <Panel icon={<Lightbulb size={15} />} title="Sugestões de tipo" tone="text-sky-200">
          {a.suggestions.length ? (
            <>
              <Types list={a.suggestions} />
              <p className="mt-2 text-[11px] text-white/40">Ajudariam a cobrir fraquezas e lacunas ofensivas.</p>
            </>
          ) : (
            <Muted>{members.length >= 6 ? "Deck completo." : "Sem sugestões no momento."}</Muted>
          )}
        </Panel>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <p className="eyebrow mb-3">Matriz defensiva — quantos membros são fracos / resistentes</p>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[520px] text-xs">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th className="px-3 py-2 text-left font-mono text-[10px] font-normal uppercase text-white/40">Ataque</th>
                  {typed.map((m) => (
                    <th key={m.id} className="px-1 py-2 text-center font-normal text-white/60"><span className="block max-w-14 truncate">{m.display}</span></th>
                  ))}
                  <th className="px-2 py-2 font-mono text-[10px] font-normal uppercase text-red-300/80">Fracos</th>
                  <th className="px-2 py-2 font-mono text-[10px] font-normal uppercase text-emerald-300/80">Resist.</th>
                </tr>
              </thead>
              <tbody>
                {TYPES.map((t) => {
                  const row = a.matrix[t];
                  const hot = a.sharedWeaknesses.includes(t);
                  return (
                    <tr key={t} className={`border-t border-white/5 ${hot ? "bg-red-500/[0.06]" : ""}`}>
                      <td className="px-3 py-1.5">
                        <span className="flex items-center gap-1.5" style={{ color: TYPE_META[t].color }}>
                          <TypeIcon type={t} size={12} /> <span className="text-white/80">{TYPE_META[t].pt}</span>
                        </span>
                      </td>
                      {typed.map((m) => <Cell key={m.id} attacker={t} types={m.types} />)}
                      <td className="px-2 text-center font-mono text-red-300">{row.weak || ""}</td>
                      <td className="px-2 text-center font-mono text-emerald-300">{row.resist + row.immune || ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <p className="eyebrow mb-3">Distribuição de tipos</p>
            <div className="space-y-1.5">
              {Object.entries(a.typeDistribution).sort((x, y) => (y[1] ?? 0) - (x[1] ?? 0)).map(([t, c]) => (
                <div key={t} className="flex items-center gap-2">
                  <TypeBadge type={t as TypeName} size="sm" variant="ghost" className="w-24" />
                  <div className="h-1.5 flex-1 rounded-full bg-white/5">
                    <motion.div className="h-full rounded-full" style={{ background: TYPE_META[t as TypeName].color }} initial={{ width: 0 }} animate={{ width: `${((c ?? 0) / typed.length) * 100}%` }} />
                  </div>
                  <span className="w-4 font-mono text-[11px] text-white/50">{c}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="eyebrow mb-3">Média de atributos do deck</p>
            <div className="flex h-36 items-end gap-2">
              {avg.map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="font-mono text-[10px] text-white/60">{v}</span>
                  <motion.div className="w-full rounded-t-md bg-gradient-to-t from-[var(--accent)]/40 to-[var(--accent)]" initial={{ height: 0 }} animate={{ height: `${(v / maxAvg) * 96}px` }} transition={{ delay: i * 0.05 }} />
                  <span className="font-mono text-[9px] text-white/40">{STAT_LABEL[STAT_KEYS[i]].short}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-white/35">
        <Info size={12} className="mt-0.5 shrink-0" /> Análise baseada apenas em tipos e status base. Não considera habilidades, golpes, itens ou
        estratégias — não é uma simulação de batalha competitiva.
      </p>
    </div>
  );
}

function Cell({ attacker, types }: { attacker: TypeName; types: TypeName[] }) {
  const m = types.reduce((acc, d) => acc * eff(attacker, d), 1);
  const style =
    m === 0 ? "bg-sky-500/25 text-sky-200" : m >= 4 ? "bg-red-500/40 text-red-100" : m >= 2 ? "bg-red-500/20 text-red-200" : m <= 0.25 ? "bg-emerald-500/35 text-emerald-100" : m < 1 ? "bg-emerald-500/15 text-emerald-200" : "text-white/15";
  const label = m === 1 ? "·" : m === 0.5 ? "½" : m === 0.25 ? "¼" : `${m}`;
  return (
    <td className="p-0.5 text-center">
      <span className={`block rounded py-1 font-mono ${style}`}>{label}</span>
    </td>
  );
}


function Panel({ icon, title, tone, children }: { icon: React.ReactNode; title: string; tone: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <p className={`mb-3 flex items-center gap-2 text-xs font-medium ${tone}`}>{icon} {title}</p>
      {children}
    </div>
  );
}
const Types = ({ list }: { list: TypeName[] }) => <div className="flex flex-wrap gap-1">{list.map((t) => <TypeBadge key={t} type={t} size="sm" />)}</div>;
const Muted = ({ children }: { children: React.ReactNode }) => <p className="text-xs text-white/45">{children}</p>;
