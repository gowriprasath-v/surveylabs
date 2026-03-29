export default function QuestionRenderer({ question, value, onChange, error }) {
  const handleChange = (val) => {
    onChange(question.id, val);
  };

  return (
    <div>
      <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
        {question.label}
        {(question.required === 1 || question.required === true) && (
          <span className="ml-1" style={{ color: 'var(--danger)' }}>*</span>
        )}
      </p>

      {question.type === 'mcq' && question.options && (
        <div className="space-y-2">
          {question.options.map((opt) => {
            const selected = value === opt;
            return (
              <label key={opt} className="flex items-center gap-3 cursor-pointer px-4 py-2.5 rounded-lg transition-all"
                style={{
                  background: selected ? 'var(--brand-light)' : 'var(--bg-muted)',
                  border: selected ? '1px solid var(--brand)' : '1px solid transparent',
                }}>
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  checked={selected}
                  onChange={() => handleChange(opt)}
                  className="sr-only"
                />
                <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: selected ? 'var(--brand)' : 'var(--border-strong)' }}>
                  {selected && <span className="w-2 h-2 rounded-full" style={{ background: 'var(--brand)' }} />}
                </span>
                <span className="text-sm" style={{ color: selected ? 'var(--brand)' : 'var(--text-primary)' }}>{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {question.type === 'text_short' && (
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Your answer"
          className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
          style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
      )}

      {question.type === 'text_long' && (
        <textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Your answer"
          rows={4}
          className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none resize-none"
          style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
      )}

      {question.type === 'rating' && (
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => {
            const selected = parseInt(value) >= n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => handleChange(String(n))}
                className="text-3xl transition-all duration-150 hover:scale-110"
                style={{ color: selected ? '#FBBF24' : 'var(--border-strong)' }}
              >
                ★
              </button>
            );
          })}
          {value && <span className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>{value}/5</span>}
        </div>
      )}

      {error && <p className="mt-2 text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}
