import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSurvey, updateSurvey } from '../api/surveyApi';
import { useToast } from '../hooks/useToast';
import AppShell from '../components/layout/AppShell';
import PageHeader from '../components/layout/PageHeader';
import QuestionBuilder from '../components/survey/QuestionBuilder';
import Spinner from '../components/ui/Spinner';

export default function EditSurveyPage() {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState('standard');
  const [questions, setQuestions] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getSurvey(id);
        setTitle(data.survey.title);
        setDescription(data.survey.description || '');
        setMode(data.survey.mode || 'standard');
        setQuestions(data.questions || []);
      } catch (err) {
        toast.error('Failed to load survey');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate, toast]);

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
      await updateSurvey(id, payload);
      toast.success('Survey updated successfully!');
      navigate('/dashboard');
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to update survey');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Edit Survey"
        action={
          <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="px-4 py-2 w-full sm:w-auto text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors rounded-[var(--radius-sm)]"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="px-5 py-2 w-full sm:w-auto text-sm font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] transition-colors rounded-[var(--radius-sm)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-custom-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      />

      {error && (
        <div className="mb-6 p-4 rounded-[var(--radius-md)] bg-[var(--bad-bg)] text-[var(--danger)] text-sm font-bold border border-[var(--danger)] animate-slide-in">
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

            <div className="bg-[var(--bg-surface)] p-6 flex flex-col gap-6 rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)]">
              <div>
                <label className="block text-[13px] font-bold text-[var(--text-primary)] mb-1.5 uppercase tracking-wide">Survey Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-[15px] font-medium outline-none bg-transparent border-b-2 border-[var(--border)] focus:border-[var(--brand)] py-2 transition-colors placeholder-[var(--text-muted)]"
                  placeholder="e.g. Product Feedback"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[var(--text-primary)] mb-1.5 uppercase tracking-wide">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-[14px] leading-relaxed outline-none bg-[var(--bg-base)] border border-[var(--border)] focus:border-[var(--brand)] rounded-[var(--radius-md)] p-3 transition-all min-h-[100px] resize-none focus:ring-[3px] focus:ring-[var(--brand-light)] placeholder-[var(--text-muted)]"
                  placeholder="Optional details..."
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[var(--text-primary)] mb-1.5 uppercase tracking-wide">Display Mode</label>
                <div className="flex flex-wrap items-center bg-[var(--bg-muted)] p-1 rounded-[var(--radius-md)] overflow-hidden w-fit border border-[var(--border)]">
                  <button
                    onClick={() => setMode('standard')}
                    className={`px-6 py-2 text-[13px] font-bold uppercase tracking-wide transition-colors rounded shrink-0 ${mode === 'standard' ? 'bg-[var(--brand)] text-white shadow-[var(--shadow-sm)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'}`}
                  >
                    Standard Form
                  </button>
                  <button
                    onClick={() => setMode('conversational')}
                    className={`px-6 py-2 text-[13px] font-bold uppercase tracking-wide transition-colors rounded shrink-0 ${mode === 'conversational' ? 'bg-[var(--brand)] text-white shadow-[var(--shadow-sm)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'}`}
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

        {/* Right Column 40% */}
        <div className="w-full lg:w-[40%] lg:sticky lg:top-8 mt-8 lg:mt-0">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] overflow-hidden animate-fade-in">
            <div className="px-6 py-4 bg-[var(--bg-muted)] border-b border-[var(--border)] flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
                <span className="text-[var(--brand)] text-sm">⊙</span> Editor Meta
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${mode === 'conversational' ? 'bg-[var(--brand-light)] text-[var(--brand)]' : 'bg-[#E0E0DB] text-[var(--text-secondary)]'}`}>
                {mode}
              </span>
            </div>
            
            <div className="p-8">
              <h3 className="text-2xl font-bold text-[var(--text-primary)] leading-tight mb-3 break-words">
                {title || 'Untitled Survey'}
              </h3>
              <p className="text-[13px] text-[var(--text-secondary)] break-words line-clamp-4 leading-relaxed mb-8">
                {description || 'No description provided.'}
              </p>
              
              <div className="border border-[var(--border)] rounded-[var(--radius-lg)] bg-[var(--bg-muted)] p-6 text-center shadow-[var(--shadow-sm)]">
                <div className="text-[40px] font-black text-[var(--brand)] mb-1 leading-none tracking-tight">
                  {questions.length}
                </div>
                <div className="text-[12px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-2">
                  Question{questions.length !== 1 ? 's' : ''} Built
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
