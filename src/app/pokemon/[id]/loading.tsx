export default function Loading() {
  return (
    <div className="mx-auto grid min-h-[100svh] max-w-[1440px] items-center gap-10 px-4 pt-28 md:px-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="skeleton h-4 w-40 rounded" />
        <div className="skeleton h-24 w-3/4 rounded-lg" />
        <div className="skeleton h-4 w-56 rounded" />
        <div className="flex gap-2">
          <div className="skeleton h-8 w-24 rounded" />
          <div className="skeleton h-8 w-24 rounded" />
        </div>
        <div className="skeleton h-20 w-full max-w-md rounded-xl" />
      </div>
      <div className="skeleton mx-auto aspect-square w-3/4 rounded-full" />
    </div>
  );
}
