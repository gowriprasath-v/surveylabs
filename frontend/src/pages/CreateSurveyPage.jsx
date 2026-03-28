import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSurvey } from '../api/surveyApi';
import { useToast } from '../hooks/useToast';
import AppShell from '../components/layout/AppShell';
import PageHeader from '../components/layout/PageHeader';
import QuestionBuilder from '../components/survey/QuestionBuilder';

export default function CreateSurveyPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState('standard');
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const handleSave = async () => {
    setError('');
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (questions.length === 0) {
      setError('Add at least one question');
      return;
    }
    const emptyQ = questions.find(q => !q.label.trim());
    if (emptyQ) {
      setError('All questions must have a label');
      return;
    }
    // BUG 2 ISSUE D: validate MCQ questions have at least 2 non-empty options
    const badMcq = questions.find(
      q => q.type === 'mcq' && (
        !Array.isArray(q.options) ||
        q.options.length < 2 ||
        q.options.some(o => !o.trim())
      )
    );
    if (badMcq) {
      setError('All MCQ options must have text (minimum 2 options per question)');
      return;
    }

    try {
      setSaving(true);
      const payload = { title, description, mode, questions };
      await createSurvey(payload);
      toast.success('Survey created successfully!');
      navigate('/dashboard');
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to create survey');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Create New Survey"
        action={
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors rounded-[var(--radius-sm)]"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] transition-colors rounded-[var(--radius-sm)] disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-custom-spin" />}
              {saving ? 'Saving...' : 'Save Survey'}
            </button>
          </div>
        }
      />

      {error && (
        <div className="mb-6 p-4 rounded-[var(--radius-md)] bg-[var(--bad-bg)] text-[var(--danger)] text-sm font-medium border border-[var(--danger)] animate-slide-in">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column 60% */}
        <div className="w-full lg:w-[60%] space-y-10">
          
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Survey Details</h2>
              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>

            <div className="bg-[var(--bg-surface)] p-6 rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] space-y-6">
              <div>
                <label className="block text-[13px] font-bold text-[var(--text-primary)] mb-1.5 uppercase tracking-wide">Survey Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-base outline-none bg-transparent border-b-2 border-[var(--border)] focus:border-[var(--brand)] py-2 transition-colors placeholder-[var(--text-muted)]"
                  placeholder="e.g. Employee Satisfaction"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[var(--text-primary)] mb-1.5 uppercase tracking-wide">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm outline-none bg-[var(--bg-base)] border border-[var(--border)] focus:border-[var(--brand)] rounded-[var(--radius-md)] p-3 transition-all min-h-[100px] resize-none focus:ring-4 focus:ring-[var(--brand-light)] placeholder-[var(--text-muted)]"
                  placeholder="Optional details about this survey..."
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[var(--text-primary)] mb-1.5 uppercase tracking-wide">Display Mode</label>
                <div className="flex items-center bg-[var(--bg-muted)] p-1 rounded-[var(--radius-md)] overflow-hidden w-fit border border-[var(--border)]">
                  <button
                    onClick={() => setMode('standard')}
                    className={`px-6 py-2 text-sm font-semibold transition-colors rounded shrink-0 ${mode === 'standard' ? 'bg-[var(--brand)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'}`}
                  >
                    Standard Form
                  </button>
                  <button
                    onClick={() => setMode('conversational')}
                    className={`px-6 py-2 text-sm font-semibold transition-colors rounded shrink-0 ${mode === 'conversational' ? 'bg-[var(--brand)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'}`}
                  >
                    Conversational ✦
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section>
            <QuestionBuilder questions={questions} onChange={setQuestions} />
          </section>

        </div>

        {/* Right Column 40% Live Preview Meta */}
        <div className="w-full lg:w-[40%] lg:sticky lg:top-8 mt-8 lg:mt-0">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] overflow-hidden">
            <div className="px-6 py-4 bg-[var(--bg-muted)] border-b border-[var(--border)] flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
                <span className="text-[var(--brand)]">⊙</span> Live Preview Meta
              </span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm ${mode === 'conversational' ? 'bg-[var(--brand-light)] text-[var(--brand)]' : 'bg-[#E0E0DB] text-[var(--text-secondary)]'}`}>
                {mode}
              </span>
            </div>
            
            <div className="p-8">
              <h3 className="text-2xl font-bold text-[var(--text-primary)] leading-tight mb-2 break-words">
                {title || 'Untitled Survey'}
              </h3>
              <p className="text-sm text-[var(--text-muted)] break-words line-clamp-4 leading-relaxed mb-8">
                {description || 'No description provided.'}
              </p>
              
              <div className="border border-[var(--border)] rounded-[var(--radius-lg)] bg-[var(--bg-muted)] p-6 text-center">
                <div className="text-4xl font-black text-[var(--brand)] mb-1">
                  {questions.length}
                </div>
                <div className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
                  Question{questions.length !== 1 ? 's' : ''} Built
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-[var(--border)] bg-[#FAFAF8] text-xs text-center font-medium text-[var(--text-muted)] italic">
              Changes auto-sync to preview
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
