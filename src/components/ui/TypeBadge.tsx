import { TYPE_META } from "@/lib/constants";
import type { TypeName } from "@/lib/types";
import { TypeIcon } from "./TypeIcon";

interface Props {
  type: TypeName;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "ghost";
  className?: string;
}

export function TypeBadge({ type, size = "md", variant = "solid", className = "" }: Props) {
  const meta = TYPE_META[type];
  if (!meta) return null;
  const pad = size === "sm" ? "h-5 px-1.5 text-[10px] gap-1" : size === "lg" ? "h-8 px-3 text-xs gap-2" : "h-6 px-2 text-[11px] gap-1.5";
  const icon = size === "sm" ? 10 : size === "lg" ? 14 : 12;
  return (
    <span
      className={`inline-flex items-center rounded-[4px] font-mono uppercase tracking-[0.08em] ${pad} ${className}`}
      style={
        variant === "solid"
          ? { background: meta.color, color: "#0c0c0c" }
          : { background: `color-mix(in oklab, ${meta.color} 14%, transparent)`, color: meta.light, boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${meta.color} 40%, transparent)` }
      }
    >
      <TypeIcon type={type} size={icon} />
      {meta.pt}
    </span>
  );
}

export function TypeDot({ type, size = 10 }: { type: TypeName; size?: number }) {
  return (
    <span
      title={TYPE_META[type]?.pt}
      className="inline-block rounded-full"
      style={{ width: size, height: size, background: TYPE_META[type]?.color, boxShadow: "0 0 0 2px rgb(0 0 0 / .35)" }}
    />
  );
}
