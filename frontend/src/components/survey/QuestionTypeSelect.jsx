const TYPES = [
  { value: 'mcq', label: 'Multiple Choice', icon: '○' },
  { value: 'text_short', label: 'Short Text', icon: '—' },
  { value: 'text_long', label: 'Long Text', icon: '≡' },
  { value: 'rating', label: 'Rating', icon: '★' },
];

export default function QuestionTypeSelect({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TYPES.map((t) => {
        const isSelected = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: isSelected ? 'var(--brand-light)' : 'var(--bg-surface)',
              border: isSelected ? '2px solid var(--brand)' : '1px solid var(--border)',
              color: isSelected ? 'var(--brand)' : 'var(--text-secondary)',
            }}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
