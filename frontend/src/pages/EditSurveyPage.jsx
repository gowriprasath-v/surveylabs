import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { getSurvey, updateSurvey } from '../api/surveyApi';
import { useToast } from '../context/ToastContext';
import AppShell from '../components/layout/AppShell';
import QuestionBuilder from '../components/survey/QuestionBuilder';
import { Smartphone, Monitor, LayoutTemplate, Layers, MousePointer2, Type, List, Star, Scale, Calendar, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const MODULES = [
  { group: 'Basic', items: [
    { type: 'text_short', label: 'Short Text', icon: Type },
    { type: 'mcq', label: 'Multiple Choice', icon: List },
    { type: 'rating', label: 'Rating', icon: Star },
  ]},
  { group: 'Advanced', items: [
    { type: 'scale', label: 'Scale', icon: Scale },
    { type: 'date', label: 'Date', icon: Calendar },
  ]}
];

export default function EditSurveyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState('standard');
  const [questions, setQuestions] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  const isInitialLoad = useRef(true);
  const debouncedSurveyState = useDebounce({ title, description, mode, questions }, 2000);

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
        isInitialLoad.current = false;
      }
    })();
  }, [id, navigate, toast]);

  // Auto-Save Effect
  useEffect(() => {
    if (isInitialLoad.current || loading) return;
    handleSave(true);
  }, [debouncedSurveyState]);

  const handleSave = async (isAutoSave = false) => {
    if (!title.trim() || questions.length === 0) return; 
    try {
      if (!isAutoSave) setSaving(true);
      const payload = { title, description, mode, questions };
      await updateSurvey(id, payload);
      setLastSaved(new Date().toLocaleTimeString());
      if (!isAutoSave) {
        toast.success('Survey updated successfully!');
        navigate('/dashboard');
      }
    } catch (err) {
      if (!isAutoSave) toast.error('Failed to update survey');
    } finally {
      if (!isAutoSave) setSaving(false);
    }
  };

  const [previewDevice] = useState('mobile');
  const [showFullscreenDesktop, setShowFullscreenDesktop] = useState(false);
  const mobileIframeRef = useRef(null);
  const desktopIframeRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const payload = { type: 'LIVE_PREVIEW_SYNC', payload: { title, description, mode, questions } };
      if (mobileIframeRef.current?.contentWindow) {
        mobileIframeRef.current.contentWindow.postMessage(payload, '*');
      }
      if (desktopIframeRef.current?.contentWindow) {
        desktopIframeRef.current.contentWindow.postMessage(payload, '*');
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [title, description, mode, questions]);

  const addModule = (type) => {
    const newQ = { id: crypto.randomUUID(), label: '', type, required: false, logic_rules: [] };
    if (type === 'mcq') newQ.options = ['', ''];
    setQuestions([...questions, newQ]);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px] animate-pulse">
           <div className="text-text-2 font-display">Loading builder...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="glass-panel rounded-[var(--radius-xl)] p-6 sm:p-8 mb-5 shadow-sm">
        <div className="max-w-[1320px] mx-auto flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <Badge variant="indigo">Survey Builder</Badge>
              <Badge variant="glass" dot>Editing Active Survey</Badge>
            </div>
            <h1 className="text-3xl font-display font-semibold text-text-1 tracking-tight">Edit Survey</h1>
            <p className="text-sm font-medium text-text-2 mt-2 max-w-xl">Modify questions or change the title. Note that deleting questions will remove associated responses.</p>
            {lastSaved && <span className="text-xs text-text-2/70 font-medium mt-1 inline-block">Auto-saved at {lastSaved}</span>}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/surveys')} className="!rounded-full px-5 py-2.5">
              Cancel
            </Button>
            <Button variant="primary" onClick={() => handleSave(false)} disabled={saving} className="gap-2 !rounded-full px-6 py-2.5">
              {saving && <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-custom-spin" />}
              {saving ? 'Saving...' : 'Update Survey'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start relative h-[calc(100vh-200px)] justify-center">

        {/* ── CENTER PANEL: CANVAS (MAIN FOCUS, AUTO-EXPANDING) ── */}
        <div className="w-full lg:w-[55%] lg:max-w-3xl flex-1 overflow-y-auto h-full pr-2 pb-20 custom-scrollbar mx-auto">
           <Card padding="p-6" className="mb-6 border-t-2 border-t-primary">
             <input
               type="text" value={title} onChange={(e) => setTitle(e.target.value)}
               className="w-full text-2xl sm:text-3xl font-display font-semibold outline-none !bg-transparent !border-t-0 !border-l-0 !border-r-0 border-b-2 border-transparent focus:border-primary !rounded-none focus:ring-0 !shadow-none py-2 transition-colors placeholder-text-2/50 mb-4 text-text-1"
               placeholder="Survey Title"
             />
             <textarea
               value={description} onChange={(e) => setDescription(e.target.value)}
               className="w-full text-sm leading-relaxed outline-none bg-surface-2 border border-[var(--color-border)] focus:border-primary/50 rounded-xl p-4 transition-all min-h-[110px] resize-none placeholder-text-2/50 text-text-1"
               placeholder="Briefly describe the purpose of this survey..."
             />
           </Card>

           <QuestionBuilder questions={questions} onChange={setQuestions} />
        </div>

        {/* ── RIGHT PANEL: PREVIEW (30%) ── */}
        <div className="w-full lg:w-[30%] shrink-0 hidden xl:flex flex-col sticky top-24 h-full">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xs font-semibold text-text-2 flex items-center gap-2"><MousePointer2 size={14}/> Live Preview</h3>
            <div className="flex bg-surface-2 p-1 rounded-lg border border-[var(--color-border)]">
              <button className="p-1.5 rounded transition-colors bg-white text-slate-900"><Smartphone size={14} /></button>
              <button 
                onClick={() => setShowFullscreenDesktop(true)} 
                className="p-1.5 rounded transition-colors text-text-2 hover:text-text-1 hover:bg-white/5"
                title="View Fullscreen Desktop Mode"
              >
                <Monitor size={14} />
              </button>
            </div>
          </div>
          
          <div className="mx-auto transition-all duration-500 flex items-start justify-center h-full w-full">
            <div className="bg-surface shadow-lg overflow-hidden relative ring-1 ring-[var(--color-border)] rounded-[2.5rem] h-[650px] aspect-[9/19] border-[6px] border-surface-2 shrink-0">
              <div className="absolute top-0 inset-x-0 h-6 bg-surface-2 z-50 rounded-b-xl max-w-[40%] mx-auto" />
              
              <div className="w-full bg-surface-2 flex items-center px-4 border-b border-[var(--color-border)] shrink-0 relative z-10 h-14 pt-6">
                <div className="mx-auto text-[9px] font-mono text-text-2 bg-surface px-2 py-1 rounded border border-[var(--color-border)]">
                  surveylabs.io/preview
                </div>
              </div>

              <iframe 
                ref={mobileIframeRef}
                src={`/s/${id}?preview=true`}
                className="w-full bg-base"
                style={{ height: 'calc(100% - 40px)', display: 'block' }}
                title="Survey draft preview mobile"
              />
            </div>
          </div>
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
               surveylabs.io/preview
            </div>

            <Button variant="secondary" onClick={() => setShowFullscreenDesktop(false)} className="!rounded-full px-5 py-2 hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-colors">
              Close Preview
            </Button>
          </div>
          <div className="flex-1 w-full relative bg-base">
             <iframe ref={desktopIframeRef} src={`/s/${id}?preview=true&desktop=1`} className="w-full h-full border-none" title="Desktop Preview Fullscreen" />
          </div>
        </div>,
        document.body
      )}
    </AppShell>
  );
}
