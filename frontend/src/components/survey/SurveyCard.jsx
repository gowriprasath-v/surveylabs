import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, FileText, AlertCircle, Share2, Edit2, Play, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

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

  return (
    <div>
      <Card
        padding="p-0"
        className="h-full flex flex-col cursor-pointer overflow-hidden border border-[var(--color-border)] bg-surface shadow-sm hover:shadow-md transition-shadow"
      >
        <div onClick={() => navigate(`/surveys/${survey.id}/results`)} className="p-5 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-2">
            <h3 className="text-lg font-display font-semibold truncate pr-3 text-text-1 leading-tight">
              {survey.title}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={survey.mode === 'conversational' ? 'indigo' : 'gray'}>
                {survey.mode === 'conversational' ? 'Convo ✦' : 'Standard'}
              </Badge>
              <Badge variant={survey.is_active ? 'emerald' : 'gray'} dot={true}>
                {survey.is_active ? 'Active' : 'Paused'}
              </Badge>
            </div>
          </div>

          {/* Main Metric Row */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 text-text-1 bg-surface-2 px-3 py-1.5 rounded-lg border border-[var(--color-border)]">
              <BarChart2 size={16} className="text-primary stroke-[2px]" />
              <span className="text-lg font-bold leading-none">{responseCount}</span>
              <span className="text-[11px] font-semibold leading-none mt-0.5 opacity-60">Replies</span>
            </div>
            
            {showQualityWarning && (
              <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50/60 px-2.5 py-1.5 rounded-lg border border-amber-100">
                <AlertCircle size={14} className="stroke-[2px]" />
                <span className="text-[11px] font-bold">{suspectCount} flagged</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-sm mb-4 text-[var(--text-secondary)] leading-relaxed h-[40px] line-clamp-2">
            {truncateDesc(survey.description)}
          </p>

          <div className="mt-auto flex items-center gap-2 text-[11px] text-text-2 font-medium">
            <span className="flex items-center gap-1"><FileText size={12} /> {questionCount} Qs</span>
            <span>•</span>
            <span>{formatDate(survey.created_at)}</span>
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-5 py-3 border-t border-[var(--color-border)] bg-surface-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/surveys/${survey.id}/results`)}
            className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors bg-primary text-white hover:bg-primary/90 shadow-sm"
          >
            <Play size={14} fill="currentColor" /> Results
          </button>
          <button
            onClick={handleCopy}
            className="flex-[0.8] flex justify-center items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors bg-surface border border-[var(--color-border)] text-text-1 hover:bg-surface-2 shadow-sm"
          >
            <Share2 size={14} /> {copied ? 'Copied' : 'Share'}
          </button>
          <button
            onClick={() => navigate(`/surveys/${survey.id}/edit`)}
            className="flex justify-center items-center p-2 rounded-lg text-text-2 hover:text-text-1 hover:bg-surface transition-colors border border-transparent hover:border-[var(--color-border)]"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(survey.id)}
            className="flex justify-center items-center p-2 rounded-lg text-text-2 hover:text-danger hover:bg-danger/10 transition-colors border border-transparent hover:border-danger/20"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </Card>
    </div>
  );
}
