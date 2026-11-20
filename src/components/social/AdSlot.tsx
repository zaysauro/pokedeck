/**
 * Reserved advertising space. Renders nothing until NEXT_PUBLIC_ADS_ENABLED=1, so layouts are ready
 * for audience-based monetization without showing empty boxes today. Placement names let an ad
 * network (or direct sponsorships) target each slot later.
 */
export type AdPlacement = "home" | "explore" | "feed" | "catalog" | "deck" | "collection";

export function AdSlot({ placement, className = "" }: { placement: AdPlacement; className?: string }) {
  if (process.env.NEXT_PUBLIC_ADS_ENABLED !== "1") return null;
  return (
    <aside
      aria-label="Publicidade"
      data-ad-placement={placement}
      className={`flex min-h-[90px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] text-[10px] uppercase tracking-[0.3em] text-white/25 ${className}`}
    >
      Publicidade
    </aside>
  );
}
