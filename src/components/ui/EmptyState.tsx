export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 px-6 py-20 text-center">
      <div className="relative mb-6 h-20 w-16">
        <span className="absolute inset-0 -rotate-12 rounded-lg border border-white/15" />
        <span className="absolute inset-0 rotate-6 rounded-lg border border-white/25 bg-white/[0.02]" />
      </div>
      <h3 className="display text-3xl text-white">{title}</h3>
      {body && <p className="mt-2 max-w-md text-sm text-white/50">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
