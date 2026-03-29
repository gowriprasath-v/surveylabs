// ── MODIFIED START ── (imports updated for all steps)
import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResults, getIndividualResponses } from '../api/surveyApi';
import { generateInsights, extractKeywords, scoreResponseQuality } from '../utils/insightEngine';
import { exportResponsesCSV } from '../utils/exportCsv';
import { useToast } from '../hooks/useToast';
import { ClipboardList, Download, FileText, BarChart2 } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import InsightsPanel from '../components/results/InsightsPanel';
import LivePulsePanel from '../components/results/LivePulsePanel';
import QuestionCard from '../components/results/QuestionCard';
// ── MODIFIED END ──
// ── MODIFIED END ──

// REMOVED DUPLICATE — replaced by RatingAnalyticsView
// ── MODIFIED END ──

// NEW
const EmptyResponseState = () => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-5">
      <ClipboardList size={24} className="text-gray-300" />
    </div>
    <h3 className="text-base font-semibold text-gray-700 mb-1">
      No responses yet
    </h3>
    <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
      Share your survey link to start collecting responses.
      Charts and insights will appear here automatically.
    </p>
  </div>
);

export default function ResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // NEW
  const [qualityFilter, setQualityFilter] = useState('all');
  // NEW
  const [viewMode, setViewMode] = useState('chart');

  // UPDATED
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef(null);
  const toast = useToast();
  // ── MODIFIED END ──

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
      
      const [result, respData] = await Promise.all([
        getResults(id),
        getIndividualResponses(id)
      ]);
      
      setData({ ...result, responses: respData?.responses || [] });
    } catch (err) {
      if (!silent) setError(typeof err === 'string' ? err : 'Failed to load results');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const { survey } = data || {};

  // NEW
  const handleExportCSV = () => {
    exportResponsesCSV(
      survey?.id,
      survey?.title,
      responses,      // ALWAYS use unfiltered responses for CSV export
      questions
    );
  };

  // UPDATED (Step 9D - Export function)
  const handleExportPNG = async () => {
    if (!exportRef.current || isExporting) return;
    setIsExporting(true);
    try {
      // Allow Recharts animations to complete
      await new Promise(resolve => setTimeout(resolve, 800));
      const { toPng } = await import('html-to-image');
      const node = exportRef.current;
      const dataUrl = await toPng(node, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        width: node.scrollWidth,
        height: node.scrollHeight,
        style: {
          overflow: 'visible',
          height: node.scrollHeight + 'px',
        },
        filter: n =>
          !(n.dataset && n.dataset.noExport === 'true'),
      });
      const link = document.createElement('a');
      link.download = `survey-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Export failed — please try again');
    } finally {
      setIsExporting(false);
    }
  };
  // ── MODIFIED END ──

  const questions = data?.questions || [];
  const responses = data?.responses || [];

  // UPDATED (Step 8)
  const scoredResponses = useMemo(() =>
    (responses || []).map(r => ({
      ...r,
      quality: r.quality ?? r.quality_label ??
        scoreResponseQuality(r, questions).quality
    })),
    [responses, questions]
  );

  // ── CRITICAL: CSV exports unfiltered responses ──
  // filteredResponses is for UI display only
  // Export always uses full responses array
  const filteredResponses = useMemo(() => {
    if (qualityFilter === 'all') return scoredResponses;
    return scoredResponses.filter(r =>
      (r.quality ?? r.quality_label ?? 'good') === qualityFilter
    );
  }, [scoredResponses, qualityFilter]);

  // NEW (Step 3D)
  const qualityCounts = useMemo(() => {
    const getQuality = r => r.quality ?? r.quality_label ?? 'good';
    return {
      all:     scoredResponses.length,
      good:    scoredResponses.filter(r => getQuality(r) === 'good').length,
      suspect: scoredResponses.filter(r => getQuality(r) === 'suspect').length,
      spam:    scoredResponses.filter(r => getQuality(r) === 'spam').length,
    };
  }, [scoredResponses]);

  // ── CRITICAL: single source of truth ──
  // totalResponses must ALWAYS equal responses.length
  // DO NOT use survey.totalResponses or any backend count field
  const totalResponses = scoredResponses?.length ?? 0;


  // ── CRITICAL: empty state gates ──
  // All data sections (charts, insights, filters) must check
  // totalResponses > 0 before rendering
  const insights = useMemo(() =>
    generateInsights(data, filteredResponses),
    [data, filteredResponses]
  );

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

  return (
    <AppShell>
      {/* ── UPDATED START ── (Step 11A + 9B Layout) */}
      <div 
        ref={exportRef}
        id="survey-results"
        className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 bg-white w-full"
        style={{ overflow: 'visible' }}
      >
        {/* ── UPDATED END ── */}
        
        {/* ── UPDATED START ── (Header with Consistent Action Buttons) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
          {/* LEFT: Survey info */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
              Survey Results
            </p>
            <h1 className="text-2xl font-semibold text-gray-900 leading-tight">
              {survey?.title || 'Survey Results'}
            </h1>
            <p className="text-sm text-gray-500 mt-1.5">
              {/* SINGLE SOURCE — always from responses.length */}
              {totalResponses} response{totalResponses !== 1 ? 's' : ''}
              {survey?.created_at && (
                <span className="ml-2 text-gray-400">
                  · Created {new Date(survey.created_at).toLocaleDateString(
                    'en-US', { month: 'short', day: 'numeric', year: 'numeric' }
                  )}
                </span>
              )}
            </p>
          </div>

          {/* RIGHT: Actions */}
          <div
            className="flex items-center gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0"
            data-no-export="true"
          >
            {/* Secondary: Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-gray-700 text-[13px] font-medium border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm min-h-[36px]"
              title="Export CSV"
            >
              <FileText size={14} />
              <span>CSV</span>
            </button>

            {/* Primary: Export PNG */}
            <button
              onClick={handleExportPNG}
              disabled={isExporting}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm min-h-[36px]"
              title="Export PNG"
            >
              {isExporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                  <span>Loading</span>
                </>
              ) : (
                <>
                  <Download size={14} shrink-0="true" />
                  <span>PNG</span>
                </>
              )}
            </button>
          </div>
        </div>
        {/* ── UPDATED END ── */}

        {/* ── UPDATED START ── (Controls Row Step 11C / Quality Filter Step 3 / Toggle Step 4) */}
        {totalResponses > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Quality filter */}
            <div className="inline-flex flex-wrap items-center gap-0.5 bg-gray-50 border border-gray-100 rounded-lg p-0.5 w-full sm:w-auto" data-no-export="true">
              {[
                { value: 'all',     label: 'All'     },
                { value: 'good',    label: 'Good'    },
                { value: 'suspect', label: 'Suspect' },
                { value: 'spam',    label: 'Spam'    },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setQualityFilter(opt.value)}
                  className={`
                    flex-1 sm:flex-none px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors
                    flex items-center justify-center
                    ${qualityFilter === opt.value
                      ? 'bg-white text-indigo-700 shadow-sm border border-gray-200/50'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                    }
                  `}
                >
                  {opt.label}
                  <span className={`
                    ml-1.5 text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded font-semibold
                    ${qualityFilter === opt.value
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'bg-gray-100 text-gray-500'
                    }
                  `}>
                    {qualityCounts[opt.value]}
                  </span>
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex w-full sm:w-auto items-center gap-0.5 bg-gray-50 border border-gray-100 rounded-lg p-0.5" data-no-export="true">
              {['chart', 'raw'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex-1 sm:flex-none justify-center
                    px-3 py-1.5 rounded-md text-[13px] font-medium capitalize
                    transition-colors
                    ${viewMode === mode
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                    }
                  `}
                >
                  {mode === 'chart' ? 'Charts' : 'Raw Data'}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* ── UPDATED END ── */}

        {/* ── CONDITIONAL DATA SECTIONS (Step 2B) ── */}
        {totalResponses > 0 && (
          <div className="space-y-8">
            <LivePulsePanel surveyId={id} />
            
            <InsightsPanel insights={insights} />

            <div className="space-y-4">
              {questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={index}
                  viewMode={viewMode}
                  filteredResponses={filteredResponses}
                />
              ))}
            </div>
          </div>
        )}

        {totalResponses === 0 && (
          <EmptyResponseState />
        )}
        {/* ── END CONDITIONAL SECTIONS ── */}
        {/* ── UPDATED END ── */}

      </div>
    </AppShell>
  );
}
