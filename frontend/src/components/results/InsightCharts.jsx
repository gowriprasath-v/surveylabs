// UPDATED: full rewrite with type-aware view toggle + fixed share feature
import { useState, useRef, useMemo } from 'react';
import { toPng } from 'html-to-image';
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip,
  PieChart, Pie, Cell,
  ResponsiveContainer
} from 'recharts';
import { generateInsights } from '../../utils/insightEngine';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// ── InsightTag ──────────────────────────────────────────────────────────────
export function InsightTag({ type, label }) {
  if (!type || !label) return null;
  const colorMap = {
    consensus: 'bg-green-100 text-green-800 border-green-200',
    divided:   'bg-red-100   text-red-800   border-red-200',
    trend:     'bg-blue-100  text-blue-800  border-blue-200',
    quality:   'bg-yellow-100 text-yellow-800 border-yellow-200',
    majority:  'bg-green-100 text-green-800 border-green-200',
    rating:    'bg-orange-100 text-orange-800 border-orange-200',
  };
  const theme = colorMap[type.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border ${theme} whitespace-nowrap`}>
      {label}
    </span>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
// ── MODIFIED START ── (Respect forced view and hideControls)
export default function InsightCharts({ question, results, insights: propInsights = [], forceView, hideControls }) {
  const [internalViewMode, setInternalViewMode] = useState('chart');
  const viewMode = forceView || internalViewMode;
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);
// ── MODIFIED END ──

  const qType = question?.type || 'mcq';

  // Normalise MCQ results: object {"Yes":40} OR array [{option,count}] → array
  const chartData = useMemo(() => {
    if (qType === 'rating' && results && typeof results === 'object' && 'distribution' in results) {
      // Rating question: reshape distribution into bar-friendly array
      return ['1','2','3','4','5'].map(k => ({
        option: `${k} ★`,
        count: results.distribution?.[k] || 0,
      }));
    }
    if (Array.isArray(results)) return results;
    if (results && typeof results === 'object') {
      return Object.entries(results).map(([option, count]) => ({ option, count: Number(count) || 0 }));
    }
    return [];
  }, [results, qType]);

  // Text answers: for text types results is an array of strings
  const textAnswers = useMemo(() => {
    if (qType === 'text' || qType === 'text_short' || qType === 'text_long') {
      return Array.isArray(results) ? results : [];
    }
    return [];
  }, [results, qType]);

  // Compute per-question insights and merge with prop insights (deduplicated)
  const allInsights = useMemo(() => {
    const engineInsights = question ? generateInsights({ questions: [{ ...question, results }] }) : [];
    const seen = new Set(propInsights.map(i => i.text));
    const merged = [...propInsights];
    engineInsights.forEach(i => { if (!seen.has(i.text)) merged.push(i); });
    return merged;
  }, [question, results, propInsights]);

  const hasData = chartData.length > 0 || textAnswers.length > 0;
  if (!hasData) {
    return <p className="text-[13px] text-[var(--text-muted)] italic py-4">No data available.</p>;
  }

  // ── Share: Copy Link ────────────────────────────────────────────────────
  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/surveys/${question?.survey_id || ''}/results`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl);
    } else {
      window.prompt('Copy this link:', shareUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Share: Download PNG via html-to-image ───────────────────────────────
  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        style: { fontFamily: 'system-ui, sans-serif' },
      });
      const link = document.createElement('a');
      link.download = `survey-${question?.survey_id || 'chart'}-q${question?.id || Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('PNG export failed:', err);
    }
  };

  return (
    <div ref={cardRef} className="flex flex-col gap-4 mt-2">

      {/* ── Row: Insights + Controls ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">

        {/* Insight tags — always visible in both modes */}
        {allInsights.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allInsights.map((ins, idx) => (
              <InsightTag key={idx} type={ins.type} label={ins.label || ins.text} />
            ))}
          </div>
        )}

        {/* View toggle + Share */}
        {!hideControls && (
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* Toggle — only show Chart option when chart is meaningful */}
            {/* REMOVED — replaced by global toggle 
            {!forceView && (
              <div className="flex bg-[var(--bg-muted)] p-[3px] rounded-lg border border-[var(--border)]">
                <button
                  onClick={() => setInternalViewMode('raw')}
                  className={`px-3 py-1 text-[12px] font-bold rounded-md transition-all ${
                    viewMode === 'raw'
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  Raw
                </button>
                <button
                  onClick={() => setInternalViewMode('chart')}
                  className={`px-3 py-1 text-[12px] font-bold rounded-md transition-all ${
                    viewMode === 'chart'
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  Chart
                </button>
              </div>
            )}
            */}

            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 text-[12px] font-bold rounded-md border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:border-[var(--brand)] transition-all whitespace-nowrap"
            >
              {copied ? '✓ Copied' : '🔗 Share'}
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-[12px] font-bold rounded-md bg-[var(--brand)] text-white hover:opacity-90 transition-all whitespace-nowrap"
            >
              ⬇ PNG
            </button>
          </div>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}

      {/* TEXT questions — Raw: answer list, Chart: keyword tags */}
      {(qType === 'text' || qType === 'text_short' || qType === 'text_long') && (
        viewMode === 'raw' ? (
          <div className="flex flex-col gap-2">
            {textAnswers.length === 0
              ? <p className="text-[13px] text-[var(--text-muted)] italic">No answers recorded.</p>
              : textAnswers.slice(0, 20).map((ans, i) => (
                  <div key={i} className="px-4 py-3 text-[14px] bg-[var(--bg-muted)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] leading-relaxed">
                    {ans}
                  </div>
                ))
            }
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 py-4">
            {allInsights.filter(i => i.type === 'trend').length === 0
              ? <p className="text-[13px] text-[var(--text-muted)] italic">No keyword trends detected yet.</p>
              : allInsights.filter(i => i.type === 'trend').map((ins, i) => (
                  <InsightTag key={i} type="trend" label={ins.label || ins.text} />
                ))
            }
          </div>
        )
      )}

      {/* MCQ + RATING questions — raw mode hidden when forceView is bar/pie */}
      {(qType === 'mcq' || qType === 'rating') && (
        viewMode === 'raw' ? (
          <ul className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-lg overflow-hidden">
            {chartData.length === 0
              ? <li className="px-5 py-4 text-[13px] text-[var(--text-muted)] italic">No data available.</li>
              : chartData.map((row, i) => (
                  <li key={i} className="flex justify-between items-center px-5 py-3 text-[14px] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] transition-colors">
                    <span className="font-medium text-[var(--text-primary)]">{row.option}</span>
                    <span className="text-[var(--text-muted)] font-bold tabular-nums">{row.count} responses</span>
                  </li>
                ))
            }
          </ul>
        ) : (
          <div className={`flex flex-wrap gap-5`}>
            {/* Bar Chart — shown when forceView is bar, or no forceView */}
            {(!forceView || forceView === 'bar') && (
              <div className="flex-1 min-w-[300px] h-64 bg-[#FAFAF8] rounded-lg p-5 border border-[var(--border)] relative">
                <h4 className="absolute top-4 left-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest z-10">
                  Volume
                </h4>
                <div className="pt-5 w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="option" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }} />
                      <Bar dataKey="count" fill="var(--brand)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Pie Chart — MCQ only */}
            {qType === 'mcq' && (!forceView || forceView === 'pie') && (
              <div className="flex-1 min-w-[300px] h-64 bg-[#FAFAF8] rounded-lg p-5 border border-[var(--border)] relative">
                <h4 className="absolute top-4 left-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest z-10">
                  Distribution
                </h4>
                <div className="w-full h-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} dataKey="count" nameKey="option" cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2}>
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

          </div>
        )
      )}

    </div>
  );
}
