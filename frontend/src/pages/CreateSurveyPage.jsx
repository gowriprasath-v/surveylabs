import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { createSurvey } from '../api/surveyApi';
import { useToast } from '../context/ToastContext';
import AppShell from '../components/layout/AppShell';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import QuestionBuilder from '../components/survey/QuestionBuilder';
import { Monitor, Smartphone, MousePointer2 } from 'lucide-react';

const DRAFT_KEY = 'surveylabs_draft_preview';

export default function CreateSurveyPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState('standard');
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fromTemplate, setFromTemplate] = useState('');
  const [previewDevice] = useState('mobile');
  const [showFullscreenDesktop, setShowFullscreenDesktop] = useState(false);
  const mobileIframeRef = useRef(null);
  const desktopIframeRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  useEffect(() => {
    const tpl = location.state?.template;
    if (tpl) {
      setTitle(tpl.title || '');
      setQuestions((tpl.questions || []).map((q, i) => ({ ...q, id: `q_${Date.now()}_${i}` })));
      setFromTemplate(tpl.title);
    }
  }, []);

  // Keep a draft snapshot in sessionStorage for the live preview iframe.
  useEffect(() => {
    const payload = {
      title,
      description,
      mode,
      questions,
      updatedAt: Date.now(),
    };
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota / blocked storage
    }
  }, [title, description, mode, questions]);

  // Push updates smoothly to iframes
  useEffect(() => {
    const payload = { type: 'LIVE_PREVIEW_SYNC', payload: { title, description, mode, questions } };
    if (mobileIframeRef.current?.contentWindow) {
      mobileIframeRef.current.contentWindow.postMessage(payload, '*');
    }
    if (desktopIframeRef.current?.contentWindow) {
      desktopIframeRef.current.contentWindow.postMessage(payload, '*');
    }
  }, [title, description, mode, questions]);

  const previewSrc = `/s/draft?preview=true&device=mobile`;
  const desktopPreviewSrc = `/s/draft?preview=true&device=desktop`;

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
      <div className="glass-panel rounded-[var(--radius-xl)] p-6 sm:p-8 mb-5 shadow-sm">
        <div className="max-w-[1320px] mx-auto flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <Badge variant="indigo">Survey Builder</Badge>
              <Badge variant="glass" dot>Drafting mode</Badge>
            </div>
            <h1 className="text-3xl font-display font-semibold text-text-1 tracking-tight">Create New Survey</h1>
            <p className="text-sm font-medium text-text-2 mt-2 max-w-xl">Define your survey structure, then craft questions that surface the insights you need.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="!rounded-full px-5 py-2.5">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving} className="gap-2 !rounded-full px-6 py-2.5">
              {saving && <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-custom-spin" />}
              {saving ? 'Saving...' : 'Save Survey'}
            </Button>
          </div>
        </div>
      </div>

      {fromTemplate && (
        <div className="mb-6 p-4 rounded-[18px] bg-primary/10 text-primary text-sm font-medium border border-primary/30 flex items-center gap-2">
          Loaded from template: <strong>{fromTemplate}</strong>. Edit any question or add new ones.
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-[18px] bg-danger/10 text-danger text-sm font-medium border border-danger/30 animate-slide-in">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column 60% */}
        <div className="w-full lg:w-[60%] space-y-10">
          
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-text-1">Survey Details</h2>
              <div className="h-px flex-1 bg-[var(--color-border)]" />
            </div>

            <Card padding="p-6" className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-text-2 mb-1.5">Survey Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-base outline-none !bg-transparent !border-t-0 !border-l-0 !border-r-0 border-b-2 border-[var(--color-border)] focus:border-primary !rounded-none focus:ring-0 !shadow-none py-2 transition-colors placeholder:text-text-2/60"
                  placeholder="e.g. Employee Satisfaction"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-2 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm outline-none bg-surface-2 border border-[var(--color-border)] focus:border-primary rounded-xl p-3 transition-all min-h-[110px] resize-none placeholder:text-text-2/60"
                  placeholder="Optional details about this survey..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-2 mb-1.5">Display Mode</label>
                <div className="flex items-center bg-surface-2 p-1 rounded-lg overflow-hidden w-fit border border-[var(--color-border)]">
                  <button
                    onClick={() => setMode('standard')}
                    className={`px-6 py-2 text-sm font-semibold transition-colors rounded shrink-0 ${mode === 'standard' ? 'bg-white text-slate-900' : 'text-text-2 hover:text-text-1 hover:bg-surface-3'}`}
                  >
                    Standard Form
                  </button>
                  <button
                    onClick={() => setMode('conversational')}
                    className={`px-6 py-2 text-sm font-semibold transition-colors rounded shrink-0 ${mode === 'conversational' ? 'bg-white text-slate-900' : 'text-text-2 hover:text-text-1 hover:bg-surface-3'}`}
                  >
                    Conversational
                  </button>
                </div>
              </div>
            </Card>
          </section>

          <section>
            <QuestionBuilder questions={questions} onChange={setQuestions} />
          </section>

        </div>

        {/* Right Column 40% Live Preview */}
        <div className="w-full lg:w-[40%] lg:sticky lg:top-8 mt-8 lg:mt-0">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xs font-semibold text-text-2 flex items-center gap-2">
              <MousePointer2 size={14} /> Live Preview
            </h3>
            <div className="flex bg-surface-2 p-1 rounded-lg border border-[var(--color-border)]">
              <button
                type="button"
                className="p-1.5 rounded transition-colors bg-white text-slate-900"
                aria-label="Mobile preview"
              >
                <Smartphone size={14} />
              </button>
              <button
                type="button"
                onClick={() => setShowFullscreenDesktop(true)}
                className="p-1.5 rounded transition-colors text-text-2 hover:text-text-1 hover:bg-white/5"
                aria-label="Desktop Fullscreen Preview"
                title="View Fullscreen"
              >
                <Monitor size={14} />
              </button>
            </div>
          </div>

          <Card padding="p-0" className="overflow-hidden">
            <div className="px-6 py-4 bg-surface-2 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-text-2">Draft preview</span>
                <span className="text-[11px] text-text-2/70 font-semibold mt-0.5">
                  {questions.length} question{questions.length === 1 ? '' : 's'}
                </span>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm ${mode === 'conversational' ? 'bg-primary/15 text-primary' : 'bg-surface-3 text-text-2'}`}>
                {mode}
              </span>
            </div>

            <div className="p-6">
              <div className="mx-auto transition-all duration-500 flex items-start justify-center w-full">
                <div className="bg-surface shadow-lg overflow-hidden relative ring-1 ring-[var(--color-border)] rounded-[2.5rem] h-[650px] aspect-[9/19] border-[6px] border-surface-2 shrink-0">
                  <div className="absolute top-0 inset-x-0 h-6 bg-surface-2 z-50 rounded-b-xl max-w-[40%] mx-auto" />
                  <div className="w-full bg-surface-2 flex items-center px-4 border-b border-[var(--color-border)] shrink-0 relative z-10 h-14 pt-6">
                    <div className="mx-auto text-[9px] font-mono text-text-2 bg-surface px-2 py-1 rounded border border-[var(--color-border)]">
                      surveylabs.io/draft-preview
                    </div>
                  </div>
                  <iframe
                    ref={mobileIframeRef}
                    src={previewSrc}
                    className="w-full bg-base"
                    style={{ height: 'calc(100% - 56px)', display: 'block' }}
                    title="Survey draft preview mobile"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--color-border)] bg-surface-2 text-xs text-center font-medium text-text-2 italic">
              Changes auto-sync to preview
            </div>
          </Card>
        </div>
      </div>

      {/* FULLSCREEN DESKTOP PREVIEW MODAL AS PORTAL */}
      {showFullscreenDesktop && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-base flex flex-col animate-in fade-in duration-200">
          <div className="h-16 border-b border-[var(--color-border)] bg-surface flex items-center justify-between px-6 shrink-0 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-3 border border-[var(--color-border)] flex items-center justify-center">
                <Monitor size={16} className="text-text-1" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-sm font-semibold text-text-1 leading-none mb-1">Desktop Preview</h2>
                <span className="text-[11px] font-medium text-text-2 leading-none">Testing wide-screen responsive layout</span>
              </div>
            </div>
            
            <div className="px-4 py-1.5 bg-surface-2 rounded border border-[var(--color-border)] font-mono text-[11px] text-text-2 absolute left-1/2 -translate-x-1/2">
               surveylabs.io/draft-preview
            </div>

            <Button variant="secondary" onClick={() => setShowFullscreenDesktop(false)} className="!rounded-full px-5 py-2 hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-colors">
              Close Preview
            </Button>
          </div>
          <div className="flex-1 w-full relative bg-base">
             <iframe ref={desktopIframeRef} src={desktopPreviewSrc} className="w-full h-full border-none" title="Desktop Preview Fullscreen" />
          </div>
        </div>,
        document.body
      )}
    </AppShell>
  );
}
