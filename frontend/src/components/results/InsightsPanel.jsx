export default function InsightsPanel({ insights }) {
  if (!insights || insights.length === 0) {
    return (
      <div className="bg-[var(--bg-surface)] p-[20px] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] animate-fade-in border-l-[4px] border-[var(--brand)] text-center">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Auto-Insights</h3>
        <p className="text-sm text-[var(--text-muted)] italic">Not enough responses yet for insights.</p>
      </div>
    );
  }

  const getDotColor = (insight) => {
    if (insight.type === 'warning') return 'bg-[var(--danger)]';
    if (insight.type === 'majority' && insight.strength === 'strong') return 'bg-[var(--success)]';
    if (insight.type === 'rating' && insight.strength === 'strong' && insight.text.includes('excellent')) return 'bg-[var(--success)]';
    if (insight.type === 'rating' && insight.strength === 'strong' && insight.text.includes('poor')) return 'bg-[var(--danger)]';
    return 'bg-[var(--warning)]'; // Default / moderate
  };

  return (
    <div className="bg-[var(--bg-surface)] p-[20px] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] animate-fade-in mb-6 border-l-[4px] border-[var(--brand)]">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[var(--brand)] text-lg leading-none">✧</span>
        <h3 className="text-[14px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          AI Auto-Insights
        </h3>
      </div>
      <div className="space-y-4">
        {insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${getDotColor(insight)}`} />
            <p className="text-[14px] font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {insight.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
