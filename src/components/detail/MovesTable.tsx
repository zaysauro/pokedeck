"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { MOVE_METHOD_PT } from "@/lib/constants";
import { norm, prettyName } from "@/lib/format";
import type { MoveEntry } from "@/lib/types";

export function MovesTable({ moves }: { moves: MoveEntry[] }) {
  const methods = useMemo(() => [...new Set(moves.map((m) => m.method))], [moves]);
  const [method, setMethod] = useState(methods.includes("level-up") ? "level-up" : methods[0] ?? "");
  const [q, setQ] = useState("");
  const list = useMemo(
    () => moves.filter((m) => m.method === method && (!q || norm(m.name).includes(norm(q).replace(/\s+/g, "-")))),
    [moves, method, q],
  );

  if (!moves.length) return <p className="text-sm text-white/45">Nenhum golpe registrado para este Pokémon.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {methods.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`h-8 rounded-full px-3 text-xs transition ${method === m ? "bg-white text-ink" : "bg-white/[0.05] text-white/65 hover:text-white"}`}
          >
            {MOVE_METHOD_PT[m] ?? prettyName(m)} <span className="ml-1 font-mono opacity-50">{moves.filter((x) => x.method === m).length}</span>
          </button>
        ))}
        <label className="ml-auto flex h-8 items-center gap-2 rounded-full border border-white/10 px-3">
          <Search size={13} className="text-white/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar golpes" className="w-32 bg-transparent text-xs outline-none placeholder:text-white/30" />
        </label>
      </div>
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-left">
            <tr>
              {method === "level-up" && <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-white/40">Nível</th>}
              <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-white/40">Golpe</th>
              <th className="hidden px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-white/40 sm:table-cell">Jogo de referência</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.name} className="border-t border-white/5 hover:bg-white/[0.02]">
                {method === "level-up" && <td className="px-4 py-2 font-mono text-white/60">{m.level || "—"}</td>}
                <td className="px-4 py-2 text-white">{prettyName(m.name)}</td>
                <td className="hidden px-4 py-2 text-xs text-white/40 sm:table-cell">{prettyName(m.versionGroup)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="px-4 py-6 text-center text-xs text-white/40">Nenhum golpe corresponde ao filtro.</p>}
      </div>
      <p className="text-[11px] text-white/35">Nomes de golpes exibidos no original em inglês (a PokéAPI ainda não oferece tradução em pt-BR).</p>
    </div>
  );
}
