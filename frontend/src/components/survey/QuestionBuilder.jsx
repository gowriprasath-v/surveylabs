import ToggleSwitch from '../ui/ToggleSwitch';

export default function QuestionBuilder({ questions, onChange }) {

  // BUG 2 FIX: options initialized as ['', ''] — empty strings, NOT 'Option 1'
  const addQuestion = () => {
    onChange([
      ...questions,
      {
        id: crypto.randomUUID(),
        label: '',
        type: 'mcq',
        required: true,
        options: ['', ''],   // ISSUE A: always start with exactly 2 empty strings
        logic_rules: []
      }
    ]);
  };

  const updateQuestion = (index, updates) => {
    const nextQ = [...questions];
    nextQ[index] = { ...nextQ[index], ...updates };
    onChange(nextQ);
  };

  const removeQuestion = (index) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  const moveQuestion = (index, dir) => {
    if (index + dir < 0 || index + dir >= questions.length) return;
    const nextQ = [...questions];
    const temp = nextQ[index];
    nextQ[index] = nextQ[index + dir];
    nextQ[index + dir] = temp;
    onChange(nextQ);
  };

  const handleOptionChange = (qIndex, oIndex, val) => {
    const q = questions[qIndex];
    const newOpts = [...q.options];
    newOpts[oIndex] = val;
    updateQuestion(qIndex, { options: newOpts });
  };

  // BUG 2 ISSUE B: addOption always adds empty string '', never prefilled text
  const addOption = (qIndex) => {
    const q = questions[qIndex];
    updateQuestion(qIndex, { options: [...q.options, ''] });
  };

  // BUG 2 ISSUE C: removeOption only allowed when options.length > 2
  const removeOption = (qIndex, oIndex) => {
    const q = questions[qIndex];
    if (q.options.length <= 2) return; // enforce minimum 2 options
    updateQuestion(qIndex, { options: q.options.filter((_, i) => i !== oIndex) });
  };

  const renderTypePills = (q, qIndex) => {
    const types = [
      { id: 'mcq', label: 'MCQ' },
      { id: 'rating', label: 'Rating' },
      { id: 'text_short', label: 'Text' }
    ];

    return (
      <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-muted)] rounded-[var(--radius-sm)] border border-[var(--border)] overflow-hidden w-fit">
        {types.map((t) => {
          const isSel = q.type === t.id || (t.id === 'text_short' && q.type.includes('text'));
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                const updates = { type: t.id };
                // When switching TO mcq, ensure at least 2 empty options exist
                if (t.id === 'mcq' && (!q.options || q.options.length < 2)) {
                  updates.options = ['', ''];
                }
                updateQuestion(qIndex, updates);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded shrink-0 transition-colors ${
                isSel ? 'bg-[var(--brand)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Questions ({questions.length})</h2>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      {questions.map((q, idx) => (
        <div key={q.id} className="relative bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)] animate-slide-in">
          
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-5">
            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[var(--brand-light)] text-[var(--brand)] text-xs font-bold leading-none mt-1">
              {idx + 1}
            </span>
            <div className="flex-1 space-y-4">
              <input
                type="text"
                placeholder={`Question ${idx + 1}`}
                value={q.label}
                onChange={(e) => updateQuestion(idx, { label: e.target.value })}
                className="w-full text-base font-medium outline-none border-b border-[var(--border)] focus:border-[var(--brand)] px-0 py-1 transition-colors bg-transparent placeholder:font-normal"
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {renderTypePills(q, idx)}
                <ToggleSwitch 
                  label="Required" 
                  checked={q.required === 1 || q.required === true} 
                  onChange={(c) => updateQuestion(idx, { required: c })} 
                />
              </div>
            </div>
            {/* Actions */}
            <div className="flex sm:flex-col items-center gap-1.5 shrink-0 ml-auto">
              <button
                type="button"
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded bg-[var(--bg-muted)] border border-transparent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={() => moveQuestion(idx, -1)}
                disabled={idx === 0}
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded bg-[var(--bg-muted)] border border-transparent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={() => moveQuestion(idx, 1)}
                disabled={idx === questions.length - 1}
                title="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--bad-bg)] rounded bg-[var(--bg-muted)] border border-transparent transition-colors"
                onClick={() => removeQuestion(idx)}
                title="Delete"
              >
                🗑
              </button>
            </div>
          </div>

          {q.type === 'mcq' && (
            <div className="pl-10 space-y-2.5">
              {q.options?.map((opt, oIdx) => (
                <div key={oIdx} className="flex flex-1 items-center gap-2 group">
                  <span className="text-[var(--border-strong)] text-sm">○</span>
                  <input
                    type="text"
                    value={opt}   // value is always empty string on creation
                    onChange={(e) => handleOptionChange(idx, oIdx, e.target.value)}
                    className="flex-1 text-sm outline-none px-2 py-1.5 border border-transparent focus:border-[var(--border)] focus:bg-[var(--bg-muted)] rounded transition-all hover:bg-[var(--bg-muted)] bg-[var(--bg-surface)] text-[var(--text-secondary)] focus:text-[var(--text-primary)]"
                    placeholder={`Option ${oIdx + 1}`}  // placeholder shows hint, value is ''
                  />
                  {/* BUG 2 ISSUE C: Only show remove button when more than 2 options */}
                  {q.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx, oIdx)}
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)] transition-all"
                      title="Remove option"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[var(--border-strong)] text-sm">○</span>
                <button
                  type="button"
                  onClick={() => addOption(idx)}
                  className="text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-hover)]"
                >
                  Add Option
                </button>
              </div>
            </div>
          )}

          {q.type === 'rating' && (
            <div className="pl-10 text-sm text-[var(--text-muted)] italic">
              Users will see a 1 to 5 star rating scale.
            </div>
          )}

          {q.type.includes('text') && (
            <div className="pl-10 text-sm text-[var(--text-muted)] italic">
              Users will see a text input field.
            </div>
          )}

        </div>
      ))}

      <button
        type="button"
        onClick={addQuestion}
        className="w-full mt-2 py-4 flex items-center justify-center gap-2 text-sm font-bold border-2 border-dashed border-[var(--border-strong)] rounded-[var(--radius-md)] text-[var(--brand)] bg-[var(--bg-surface)] transition-all duration-200 hover:border-[var(--brand)] hover:bg-[var(--brand-light)] hover:text-[var(--brand-hover)]"
      >
        <span className="text-lg leading-none mt-[-2px]">+</span> Add Question
      </button>

    </div>
  );
}
