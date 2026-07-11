export function SkeletonCard() {
  return (
    <div className="glass-strong rounded-[20px] p-5">
      <div className="skeleton h-3 w-24 mb-3 rounded-[6px]" />
      <div className="skeleton h-7 w-32 mb-2 rounded-[6px]" />
      <div className="skeleton h-3 w-20 rounded-[6px]" />
    </div>
  );
}

export function SkeletonLine({ w = 'w-48', h = 'h-4' }) {
  return <div className={`skeleton ${h} ${w} mb-3 rounded-[6px]`} />;
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="glass-strong rounded-[20px] overflow-hidden">
      <div className="p-4 border-b border-[var(--border)] flex gap-6">
        <SkeletonLine w="w-1/4" h="h-3" />
        <SkeletonLine w="w-1/4" h="h-3" />
        <SkeletonLine w="w-1/6" h="h-3" />
        <SkeletonLine w="w-1/6" h="h-3" />
      </div>
      <div className="p-4 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-6">
            <SkeletonLine w="w-1/4" h="h-3" />
            <SkeletonLine w="w-1/4" h="h-3" />
            <SkeletonLine w="w-1/6" h="h-3" />
            <SkeletonLine w="w-1/6" h="h-3" />
          </div>
        ))}
      </div>
    </div>
  );
}
