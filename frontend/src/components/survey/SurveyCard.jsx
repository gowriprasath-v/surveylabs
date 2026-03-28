import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SurveyCard({ survey, onDelete, onCopyLink }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (onCopyLink) {
      await onCopyLink(survey.id);
    } else {
      await navigator.clipboard.writeText(`${window.location.origin}/s/${survey.id}`);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qc = survey.quality_counts || {};
  const suspectCount = (qc.suspect || 0) + (qc.spam || 0);
  const totalResp = survey.response_count || 0;
  const showQualityWarning = suspectCount > 0;

  const truncateDesc = (text) => {
    if (!text) return 'No description provided.';
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  const onCardClick = () => {
    navigate(`/surveys/${survey.id}/results`);
  };

  return (
    <div
      onClick={onCardClick}
      className="rounded-xl p-5 transition-all duration-200 cursor-pointer bg-[var(--bg-surface)] border border-[var(--border)] shadow-[var(--shadow-sm)] hover:border-[var(--brand)] hover:shadow-[var(--shadow-md)] flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-bold truncate pr-3 text-[var(--text-primary)] leading-tight">
          {survey.title}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: survey.mode === 'conversational' ? 'var(--brand-light)' : 'var(--bg-muted)',
              color: survey.mode === 'conversational' ? 'var(--brand)' : 'var(--text-secondary)',
            }}
          >
            {survey.mode === 'conversational' ? 'Convo ✦' : 'Standard'}
          </span>
          <span
            className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: survey.is_active ? 'var(--good-bg)' : 'var(--bg-muted)',
              color: survey.is_active ? 'var(--success)' : 'var(--text-muted)',
            }}
          >
            {survey.is_active ? 'Active' : 'Paused'}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm mb-4 text-[var(--text-secondary)] min-h-[40px] leading-relaxed">
        {truncateDesc(survey.description)}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-x-3 gap-y-2 text-xs mb-4 flex-wrap text-[var(--text-muted)] font-medium">
        <span className="flex items-center gap-1">
          <span className="text-base">📊</span> {totalResp} response{totalResp !== 1 ? 's' : ''}
        </span>
        <span className="text-[var(--border-strong)]">•</span>
        <span className="flex items-center gap-1">
          <span className="text-base">📝</span> {survey.question_count || 0} question{(survey.question_count || 0) !== 1 ? 's' : ''}
        </span>
        <span className="text-[var(--border-strong)]">•</span>
        <span>{formatDate(survey.created_at)}</span>
      </div>

      {/* Quality warning */}
      <div className="min-h-[24px] mb-4">
        {showQualityWarning && (
          <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold bg-[var(--bad-bg)] text-[var(--danger)] border border-[var(--danger)] border-opacity-20">
            <span className="text-sm">⚠</span> {suspectCount} suspect response{suspectCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-[var(--border)] flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/surveys/${survey.id}/results`); }}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-[var(--brand-light)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white"
        >
          Results
        </button>
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          {copied ? 'Copied!' : 'Share ↗'}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/surveys/${survey.id}/edit`); }}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          Edit
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(survey.id); }}
          className="ml-auto p-1.5 rounded-lg text-sm transition-colors text-[var(--text-muted)] hover:bg-[var(--bad-bg)] hover:text-[var(--danger)]"
          title="Delete Survey"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
