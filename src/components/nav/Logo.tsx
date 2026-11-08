export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <svg width="26" height="22" viewBox="0 0 26 22" aria-hidden>
        <rect x="1" y="3" width="12" height="17" rx="2" transform="rotate(-12 7 11)" fill="none" stroke="currentColor" strokeOpacity=".35" />
        <rect x="7" y="1.5" width="12" height="17" rx="2" fill="var(--accent)" />
        <rect x="13" y="3" width="12" height="17" rx="2" transform="rotate(12 19 11)" fill="none" stroke="currentColor" strokeOpacity=".6" />
        <circle cx="13" cy="10" r="3" fill="none" stroke="var(--on-accent)" strokeWidth="1.4" />
        <path d="M7 10h3M16 10h3" stroke="var(--on-accent)" strokeWidth="1.4" />
      </svg>
      <span className="display text-[22px] leading-none">
        Poké<em className="italic text-[var(--accent)]">Deck</em>
      </span>
    </span>
  );
}
