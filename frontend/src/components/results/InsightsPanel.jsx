// ── MODIFIED START ── (Upgraded InsightsPanel: color map, keyword pills, empty state)
import { BarChart2 } from 'lucide-react';

const colorMap = {
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-800',  dot: 'bg-green-500'  },
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800',   dot: 'bg-blue-500'   },
  amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-800',  dot: 'bg-amber-500'  },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', dot: 'bg-orange-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', dot: 'bg-purple-500' },
  red:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800',    dot: 'bg-red-500'    },
};

// Legacy dot-color fallback for old insight shape
function legacyDotColor(insight) {
  if (insight.type === 'warning') return 'bg-[var(--danger)]';
  if (insight.strength === 'strong') return 'bg-[var(--success)]';
  return 'bg-[var(--warning)]';
}

export default function InsightsPanel({ insights }) {
  if (!insights || insights.length === 0) {
    return (
    <div className="bg-gray-50/50 border border-gray-100 p-4 rounded-xl mb-6 text-center animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BarChart2 size={16} className="text-gray-400" />
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-500">Auto-Insights</h3>
        </div>
        <p className="text-xs text-gray-400 italic">Not enough responses yet for insights.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 p-4 sm:p-5 rounded-xl border border-gray-100 animate-fade-in mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-indigo-400 mb-0.5">✧</span>
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-gray-500">
          Auto-Insights
        </h3>
      </div>
      <div className="space-y-3">
        {insights.map((insight, i) => {
          // New colour-keyed shape
          const c = colorMap[insight.color];
          if (c) {
            return (
              <div
                key={i}
                className={`flex items-start gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl border ${c.border} ${c.bg} transition-all`}
              >
                <div className={`w-2 h-2 rounded-full ${c.dot} mt-1.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  {insight.question && (
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
                      {insight.question}
                    </p>
                  )}
                  <p className={`text-sm font-medium ${c.text} break-words`}>{insight.text}</p>
                  {insight.keywords && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {insight.keywords.map(({ word, count }) => (
                        <span key={word}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/70
                            border border-purple-100 text-purple-700 rounded-full text-[11px] font-medium">
                          {word}
                          <span className="text-purple-400 text-[10px]">×{count}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          }
          // Legacy shape fallback (type/text/strength)
          return (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${legacyDotColor(insight)}`} />
              <p className="text-[14px] font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {insight.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
// ── MODIFIED END ──
