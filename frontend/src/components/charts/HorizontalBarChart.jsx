export default function HorizontalBarChart({ data, highlightTop = true }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No data yet</p>;
  }

  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  if (total === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No responses yet</p>;
  }

  const maxCount = Math.max(...entries.map(([, c]) => c));

  return (
    <div className="space-y-2.5">
      {entries.map(([label, count], idx) => {
        const pct = Math.round((count / total) * 100);
        const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
        const isTop = highlightTop && idx === 0 && count > 0;

        return (
          <div key={label} className="group">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm ${isTop ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                {label}
              </span>
              <span className={`text-sm font-mono ${isTop ? 'font-semibold text-[var(--brand)]' : 'text-[var(--text-muted)]'}`}>
                {pct}%
              </span>
            </div>
            <div className="h-7 rounded-md bg-[var(--bg-muted)] overflow-hidden relative">
              <div
                className={`h-full rounded-md transition-all duration-500 ease-out ${
                  isTop ? 'bg-[var(--brand)]' : 'bg-[var(--border-strong)]'
                }`}
                style={{ width: `${barWidth}%` }}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--text-muted)]">
                {count}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
