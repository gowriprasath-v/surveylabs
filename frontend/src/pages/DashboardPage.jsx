import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSurveys, deleteSurvey } from '../api/surveyApi';
import { useToast } from '../hooks/useToast';
import AppShell from '../components/layout/AppShell';
import SurveyCard from '../components/survey/SurveyCard';

export default function DashboardPage() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  // BUG 1 FIX: Use cancellation flag with [] deps — no useCallback on toast
  // (toast is recreated each render; putting it in deps causes infinite loop)
  useEffect(() => {
    let cancelled = false;
    const fetchSurveys = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSurveys();
        if (!cancelled) setSurveys(data);
      } catch (err) {
        toast.error(typeof err === 'string' ? err : 'Failed to load surveys');
        if (!cancelled) setError(err?.message || 'Failed to load surveys');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSurveys();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // BUG 1 CAUSE D: Optimistic delete — no full re-fetch after delete
  const handleDelete = async (surveyId) => {
    if (!window.confirm('Delete this survey and all its responses?')) return;
    try {
      // Optimistic update first — no flicker
      setSurveys(prev => prev.filter(s => s.id !== surveyId));
      await deleteSurvey(surveyId);
      toast.success('Survey deleted');
    } catch (err) {
      console.error('Failed to delete survey:', err);
      toast.error('Failed to delete survey');
      // Revert by re-fetching only on failure
      const data = await getSurveys().catch(() => null);
      if (data) setSurveys(data);
    }
  };

  const handleCopyLink = async (id) => {
    const link = `${window.location.origin}/s/${id}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      toast.info('Copy: ' + link);
    }
  };

  // BUG 1 CAUSE B: searchTerm only — no debounce state to avoid extra re-renders
  // useMemo is stable; no setState in memo = no re-render loop
  const filteredSurveys = useMemo(() => {
    if (!searchTerm.trim()) return surveys;
    const q = searchTerm.toLowerCase();
    return surveys.filter(s => s.title.toLowerCase().includes(q));
  }, [surveys, searchTerm]);

  return (
    <AppShell>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight text-[var(--text-primary)] mb-1">
            My Surveys
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {loading ? 'Loading...' : `${surveys.length} survey${surveys.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => navigate('/surveys/new')}
          className="shrink-0 px-4 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] transition-colors inline-flex items-center justify-center shadow-[var(--shadow-sm)]"
        >
          + New Survey
        </button>
      </div>

      {/* Search Bar — only show after data loaded and there are surveys */}
      {!loading && surveys.length > 0 && (
        <div className="mb-8 max-w-[400px] relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search surveys by title..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-[var(--radius-md)] outline-none transition-shadow bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-[3px] focus:ring-[var(--brand-light)]"
          />
        </div>
      )}

      {/* BUG 1 CAUSE C: Show skeletons while loading — never show EmptyState during load */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-48 rounded-[var(--radius-xl)] animate-shimmer" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 rounded-[var(--radius-lg)] text-sm bg-[var(--bad-bg)] text-[var(--danger)] border border-[var(--danger)] font-bold text-center">
          {error}
        </div>
      ) : surveys.length === 0 ? (
        // EmptyState only shown after loading is complete and surveys is truly empty
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-surface)] border-[var(--border)] border-dashed">
          <div className="w-16 h-16 bg-[var(--brand-light)] text-[var(--brand)] rounded-full flex items-center justify-center text-3xl mb-6 shadow-sm">
            📋
          </div>
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No surveys yet</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-[280px]">
            Create your first survey to start collecting responses
          </p>
          <button
            onClick={() => navigate('/surveys/new')}
            className="px-5 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium text-white shadow-sm transition-colors bg-[var(--brand)] hover:bg-[var(--brand-hover)]"
          >
            Create Survey
          </button>
        </div>
      ) : filteredSurveys.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[var(--bg-surface)] border border-[var(--border)] border-dashed rounded-[var(--radius-xl)]">
          <p className="text-base font-medium text-[var(--text-primary)] mb-1">No matches found</p>
          <p className="text-sm text-[var(--text-secondary)]">No surveys match &quot;{searchTerm}&quot;</p>
        </div>
      ) : (
        // BUG 1 CAUSE E: key={s.id} guaranteed — never key={index}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSurveys.map(s => (
              <SurveyCard
                key={s.id}
                survey={s}
                responseCount={s.response_count ?? 0}
                questionCount={s.question_count ?? 0}
                onDelete={handleDelete}
                onCopyLink={handleCopyLink}
              />
          ))}
        </div>
      )}
    </AppShell>
  );
}
