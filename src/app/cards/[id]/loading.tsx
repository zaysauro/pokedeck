export default function Loading() {
  return (
    <div className="mx-auto grid max-w-[1440px] gap-10 px-4 pt-32 md:px-6 lg:grid-cols-[0.9fr_1.25fr]">
      <div className="skeleton mx-auto aspect-[63/88] w-full max-w-[460px] rounded-[4.5%]" />
      <div className="space-y-4">
        <div className="skeleton h-3 w-48 rounded" />
        <div className="skeleton h-16 w-3/4 rounded-lg" />
        <div className="flex gap-2"><div className="skeleton h-7 w-24 rounded" /><div className="skeleton h-7 w-24 rounded" /></div>
        <div className="skeleton h-20 w-full rounded-xl" />
        <div className="skeleton h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}
