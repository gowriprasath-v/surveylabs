export default function SkeletonCard() {
  return (
    <div className="rounded-[var(--radius-xl)] p-5 bg-[var(--bg-surface)] border border-[var(--border)] shadow-[var(--shadow-sm)] flex flex-col h-[200px]">
      <div className="flex items-start justify-between mb-4">
        <div className="h-5 w-3/4 rounded-[var(--radius-sm)] animate-shimmer" />
        <div className="h-5 w-12 rounded-[var(--radius-sm)] animate-shimmer" />
      </div>
      <div className="space-y-2 mb-6">
        <div className="h-3 w-full rounded-[var(--radius-sm)] animate-shimmer" />
        <div className="h-3 w-5/6 rounded-[var(--radius-sm)] animate-shimmer" />
      </div>
      <div className="flex gap-2 mb-auto">
        <div className="h-3 w-16 rounded-[var(--radius-sm)] animate-shimmer" />
        <div className="h-3 w-16 rounded-[var(--radius-sm)] animate-shimmer" />
      </div>
      
      <div className="flex items-center gap-2 pt-4 border-t border-[var(--border)] mt-auto">
        <div className="h-7 w-20 rounded-[var(--radius-md)] animate-shimmer" />
        <div className="h-7 w-20 rounded-[var(--radius-md)] animate-shimmer" />
        <div className="h-7 w-16 rounded-[var(--radius-md)] animate-shimmer ml-auto" />
      </div>
    </div>
  );
}
