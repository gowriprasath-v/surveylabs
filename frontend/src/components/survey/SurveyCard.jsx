import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, FileText, AlertCircle, Share2, Edit2, Play, Trash2 } from 'lucide-react';

export default function SurveyCard({ survey, responseCount = 0, questionCount = 0, onDelete, onCopyLink }) {
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
      className="rounded-xl p-5 transition-all duration-300 cursor-pointer bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 flex flex-col h-full group"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-2 sm:gap-0">
        <h3 className="text-lg font-semibold truncate pr-3 text-gray-900 leading-tight group-hover:text-indigo-700 transition-colors">
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

      {/* Main Metric */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-md border border-indigo-100/50">
          <BarChart2 size={16} className="stroke-[2.5px]" />
          <span className="text-base font-bold leading-none">{responseCount}</span>
          <span className="text-xs font-semibold uppercase tracking-wider leading-none mt-0.5 opacity-80">Replies</span>
        </div>
        
        {showQualityWarning && (
          <div className="flex items-center gap-1.5 text-red-700 bg-red-50 px-2 py-1 rounded-md border border-red-100">
            <AlertCircle size={14} className="stroke-[2px]" />
            <span className="text-xs font-bold leading-none">{suspectCount} flagged</span>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-sm mb-4 text-gray-500 leading-relaxed min-h-[40px] line-clamp-2">
        {truncateDesc(survey.description)}
      </p>

      {/* Metadata */}
      <div className="flex items-center gap-x-2 text-[11px] mb-6 text-gray-400 font-medium">
        <span className="flex items-center gap-1.5 uppercase tracking-wider">
          <FileText size={12} /> {questionCount} Qs
        </span>
        <span className="text-gray-300">•</span>
        <span className="uppercase tracking-wider">{formatDate(survey.created_at)}</span>
      </div>

      <div className="mt-auto pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2.5 w-full">
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/surveys/${survey.id}/results`); }}
          className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm min-w-[100px]"
        >
          <Play size={14} fill="currentColor" /> Results
        </button>
        <button
          onClick={handleCopy}
          className="flex sm:flex-1 md:flex-none justify-center items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
        >
          <Share2 size={14} /> <span className="hidden sm:inline-block">{copied ? 'Copied' : 'Share'}</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/surveys/${survey.id}/edit`); }}
          className="flex sm:flex-1 md:flex-none justify-center items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
        >
          <Edit2 size={14} /> <span className="hidden sm:inline-block">Edit</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(survey.id); }}
          className="ml-auto flex justify-center items-center p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          title="Delete Survey"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
