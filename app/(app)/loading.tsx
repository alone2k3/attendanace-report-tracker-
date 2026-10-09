export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-4">
      <div className="h-9 w-64 animate-pulse rounded-[12px] bg-segmented" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-48 animate-pulse rounded-[18px] bg-segmented" />
        <div className="h-48 animate-pulse rounded-[18px] bg-segmented" />
      </div>
    </div>
  );
}
