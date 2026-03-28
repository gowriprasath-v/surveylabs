import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResults, getIndividualResponses } from '../api/surveyApi';
import { generateInsights } from '../utils/insightEngine';
import { exportResultsToCSV } from '../utils/exportCsv';
import AppShell from '../components/layout/AppShell';
import InsightsPanel from '../components/results/InsightsPanel';
import LivePulsePanel from '../components/results/LivePulsePanel';
import HorizontalBarChart from '../components/charts/HorizontalBarChart';

const FILTER_OPTIONS = ['all', 'good', 'suspect', 'spam'];

function RatingChart({ currentStats }) {
  if (!currentStats) return null;
  const avg = currentStats.average || 0;
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <span className="text-[48px] leading-none font-bold text-[var(--brand)]">
          {avg.toFixed(1)}
        </span>
        <div>
          <div className="flex items-center gap-1 text-[24px]">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} style={{ color: n <= Math.round(avg) ? '#FBBF24' : 'var(--border-strong)' }}>★</span>
            ))}
          </div>
          <p className="text-[13px] font-medium text-[var(--text-muted)] mt-1 tracking-wide uppercase">
            {currentStats.count || 0} Ratings
          </p>
        </div>
      </div>
      {currentStats.distribution && (
        <HorizontalBarChart
          data={Object.fromEntries(
            ['5', '4', '3', '2', '1'].map((k) => [`${k} ★`, currentStats.distribution[k] || 0])
          )}
          highlightTop={false}
        />
      )}
    </div>
  );
}

function TextAnswerCard({ text, qualityLevel }) {
  const qColors = {
    good: 'bg-[var(--success)]',
    suspect: 'bg-[var(--warning)]',
    spam: 'bg-[var(--danger)]'
  };
  return (
    <div className="rounded-[var(--radius-md)] p-4 text-[14px] flex items-start gap-4 bg-[var(--bg-muted)] text-[var(--text-primary)] border border-[var(--border)] transition-colors hover:bg-[var(--bg-surface)] hover:border-[var(--brand-light)]">
      <div className={`mt-1.5 shrink-0 w-2.5 h-2.5 rounded-full ${qColors[qualityLevel] || 'bg-[var(--border-strong)]'}`} />
      <span className="flex-1 leading-relaxed opacity-90">{text}</span>
    </div>
  );
}

export default function ResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedText, setExpandedText] = useState({});

  useEffect(() => {
    let active = true;
    fetchResults();
    const timer = setInterval(() => {
      if (active) fetchResults(true);
    }, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [id]);

  const fetchResults = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      if (!silent) setError('');
      const result = await getResults(id);
      setData(result);
    } catch (err) {
      if (!silent) setError(typeof err === 'string' ? err : 'Failed to load results');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // BUG 3 FIX: pass getIndividualResponses as fn — CSV uses per-row response data
  const handleExport = () => {
    if (!data) return;
    exportResultsToCSV(id, data.survey?.title, getIndividualResponses);
  };

  const filteredData = useMemo(() => {
    if (!data) return null;
    if (filter === 'all' || !data.responses) return data;

    const filteredResponses = data.responses.filter(r => (r.quality_label || 'good') === filter);
    const newQuestions = data.questions.map(q => {
      const answersForQ = filteredResponses
        .map(r => r.answers?.find(a => a.question_id === q.id)?.answer_value)
        .filter(val => val !== undefined && val !== null && val !== '');

      let newResults;
      if (q.type === 'mcq') {
        newResults = {};
        if (Array.isArray(q.options)) q.options.forEach(o => { newResults[o] = 0; });
        answersForQ.forEach(v => { newResults[v] = (newResults[v] || 0) + 1; });
      } else if (q.type === 'rating') {
        const nums = answersForQ.map(v => parseInt(v)).filter(n => !isNaN(n));
        const count = nums.length;
        const sum = nums.reduce((s, n) => s + n, 0);
        const average = count > 0 ? sum / count : 0;
        const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        nums.forEach(n => { distribution[String(n)] = (distribution[String(n)] || 0) + 1; });
        newResults = { average, count, distribution };
      } else {
        newResults = answersForQ;
      }

      return { ...q, results: newResults, total_answers: answersForQ.length };
    });

    return { ...data, questions: newQuestions, total_responses: filteredResponses.length };
  }, [data, filter]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-[3px] border-[var(--brand)] border-t-transparent rounded-full animate-custom-spin" />
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
         <div className="p-6 rounded-[var(--radius-lg)] text-[14px] bg-[var(--bad-bg)] text-[var(--danger)] border border-[var(--danger)] font-bold text-center">
           {error || 'Results not found'}
         </div>
      </AppShell>
    );
  }

  const { survey, total_responses, quality_counts } = data;
  const displayData = filteredData || data;
  const qc = quality_counts || { good: 0, suspect: 0, spam: 0 };
  const insights = generateInsights(data);

  const filterCounts = {
    all: total_responses,
    good: qc.good || (total_responses - (qc.suspect || 0) - (qc.spam || 0)),
    suspect: qc.suspect || 0,
    spam: qc.spam || 0,
  };

  return (
    <AppShell>
      {/* Full-width Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-6 border-b border-[var(--border)] gap-6">
        <div className="flex flex-col gap-2 w-full sm:w-auto text-center sm:text-left">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="text-[13px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-block w-fit"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-[32px] font-bold text-[var(--text-primary)] tracking-tight leading-none">
            {survey.title}
          </h1>
        </div>
        <button
          onClick={handleExport}
          className="w-full sm:w-auto px-6 py-2.5 rounded-[var(--radius-sm)] text-[14px] font-bold transition-all bg-[var(--bg-surface)] border-2 border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--brand)] shadow-[var(--shadow-sm)]"
        >
          Export CSV ⬇
        </button>
      </div>

      <div className="space-y-8">
        <LivePulsePanel surveyId={id} />

        {insights.length > 0 && <InsightsPanel insights={insights} />}

        {/* Quality Filter Tabs */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {FILTER_OPTIONS.map((f) => {
            const count = filterCounts[f];
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2.5 rounded-full text-[13px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 ${
                  isActive 
                    ? 'bg-[var(--brand)] text-white shadow-[var(--shadow-sm)]' 
                    : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                }`}
              >
                {f} <span className="opacity-70 ml-1">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Question Result Cards */}
        {displayData.total_responses === 0 ? (
          <div className="text-center py-24 rounded-[var(--radius-xl)] bg-[var(--bg-surface)] border border-[var(--border)] shadow-[var(--shadow-sm)]">
            <div className="text-[64px] mb-6">📊</div>
            <h3 className="text-[20px] font-bold mb-2 text-[var(--text-primary)]">No responses match this filter</h3>
            <p className="text-[15px] text-[var(--text-muted)]">Adjust your filter to explore the data.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {displayData.questions.map((q, idx) => (
              <div
                key={q.id}
                className="rounded-[var(--radius-lg)] overflow-hidden bg-[var(--bg-surface)] border border-[var(--border)] shadow-[var(--shadow-sm)] animate-slide-in relative group transition-colors hover:border-[var(--border-strong)]"
              >
                {/* Header */}
                <div className="px-6 py-5 flex items-start sm:items-center justify-between border-b border-[var(--border)] bg-[#FAFAF8] gap-4">
                  <div className="flex items-start sm:items-center gap-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--brand-light)] text-[var(--brand)] text-[14px] font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <h3 className="text-[16px] font-bold text-[var(--text-primary)] leading-tight pt-1 sm:pt-0">
                      {q.label}
                    </h3>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-sm bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border)]">
                      {q.type.replace('_', ' ')}
                    </span>
                    <span className="text-[13px] font-bold text-[var(--text-secondary)]">
                      {q.total_answers || 0} response{(q.total_answers || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  {q.type === 'mcq' && (
                    <HorizontalBarChart data={q.results} highlightTop={true} />
                  )}

                  {q.type === 'rating' && (
                    <RatingChart currentStats={q.results} />
                  )}

                  {(q.type === 'text_short' || q.type === 'text_long' || q.type === 'text') && (
                    <>
                      {(!q.results || q.results.length === 0) ? (
                        <p className="text-[14px] text-[var(--text-muted)] italic py-4 text-center">No responses recorded.</p>
                      ) : (
                        <div className="space-y-3">
                          {(expandedText[q.id] ? q.results : q.results.slice(0, 10)).map((text, i) => {
                             const qLevel = filter === 'all' ? 'good' : filter;
                             return <TextAnswerCard key={i} text={text} qualityLevel={qLevel} />
                          })}
                          {q.results.length > 10 && !expandedText[q.id] && (
                            <div className="pt-4 text-center">
                              <button
                                onClick={() => setExpandedText((prev) => ({ ...prev, [q.id]: true }))}
                                className="text-[13px] font-bold text-[var(--brand)] hover:text-[var(--brand-hover)] uppercase tracking-wider px-6 py-2 rounded-full bg-[var(--brand-light)] transition-colors"
                              >
                                View All {q.results.length} Responses
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
