const TYPE_LABELS = { mcq: 'MCQ', text_short: 'Short Text', text_long: 'Long Text', rating: 'Rating' };

export default function QuestionItem({ question, index, onEdit, onDelete, onLogic }) {
  const hasRules = question.logic_rules && question.logic_rules.length > 0;

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl transition-colors group"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-center h-7 w-7 rounded-md text-xs font-bold shrink-0 mt-0.5"
        style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
            {TYPE_LABELS[question.type] || question.type}
          </span>
          {question.required === 1 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--bad-bg)', color: 'var(--danger)' }}>
              Required
            </span>
          )}
          {hasRules && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--warn-bg)', color: 'var(--warning)' }}>
              ⚡ Logic ({question.logic_rules.length})
            </span>
          )}
        </div>
        <p className="text-sm font-medium break-words" style={{ color: 'var(--text-primary)' }}>{question.label}</p>
        {question.type === 'mcq' && question.options && (
          <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
            Options: {question.options.join(', ')}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {onLogic && (
          <button
            onClick={() => onLogic(question)}
            className="p-1.5 rounded-md text-xs transition-colors"
            style={{ color: 'var(--warning)' }}
            title="Logic Rules"
          >⚡</button>
        )}
        <button
          onClick={() => onEdit(question)}
          className="p-1.5 rounded-md text-xs transition-colors"
          style={{ color: 'var(--brand)' }}
          title="Edit"
        >✎</button>
        <button
          onClick={() => onDelete(question.id)}
          className="p-1.5 rounded-md text-xs transition-colors"
          style={{ color: 'var(--danger)' }}
          title="Delete"
        >✕</button>
      </div>
    </div>
  );
}
