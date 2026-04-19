import { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import QuestionRenderer from '../components/public/QuestionRenderer';

const DRAFT_KEY = 'surveylabs_draft_preview';

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function SurveyDraftPreviewPage() {
  const location = useLocation();
  const qs = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const device = qs.get('device') === 'desktop' ? 'desktop' : 'mobile';

  const [draft, setDraft] = useState(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    const parsed = raw ? safeParse(raw) : null;
    if (!parsed || typeof parsed !== 'object') return null;

    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
    return {
      title: typeof parsed.title === 'string' ? parsed.title : 'Untitled Survey',
      description: typeof parsed.description === 'string' ? parsed.description : '',
      mode: parsed.mode === 'conversational' ? 'conversational' : 'standard',
      questions: questions.map((q) => ({
        ...q,
        options: typeof q?.options === 'string' ? safeParse(q.options) : q?.options,
      })),
    };
  });

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data?.type === 'LIVE_PREVIEW_SYNC') {
        const { title, description, mode, questions } = e.data.payload;
        setDraft({
          title: title || 'Untitled Survey',
          description: description || '',
          mode: mode || 'standard',
          questions: (questions || []).map(q => ({
            ...q,
            options: typeof q?.options === 'string' ? safeParse(q.options) : q?.options,
          }))
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!draft) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-4 bg-base">
        <div className="text-center bg-surface border border-white/10 rounded-2xl p-8 max-w-[520px] w-full shadow-md">
          <AlertTriangle className="mx-auto text-accent w-10 h-10 mb-4 opacity-80" />
          <h2 className="text-xl font-display font-semibold mb-2 text-text-1">Preview unavailable</h2>
          <p className="text-sm text-text-2">Return to the builder to generate a live preview.</p>
        </div>
      </div>
    );
  }

  if (draft.mode === 'conversational') {
    const sample = draft.questions.slice(0, 3);
    return (
      <div className="h-[100dvh] bg-base overflow-hidden">
        <div className="flex-none px-5 py-4 bg-surface border-b border-white/10 sticky top-0 z-10">
          <h1 className="text-sm font-semibold text-text-1 truncate">{draft.title}</h1>
          <p className="text-xs font-semibold text-text-2 mt-0.5">Conversational preview</p>
        </div>

        <div className="h-[calc(100dvh-64px)] overflow-y-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            {sample.length === 0 ? (
              <div className="text-center text-text-2 text-sm bg-surface border border-white/10 rounded-2xl p-8">
                Add questions to see them in the preview.
              </div>
            ) : (
              sample.map((q) => (
                <div key={q.id} className="space-y-3">
                  <div className="flex items-end gap-2">
                    <div className="w-8 h-8 rounded-full bg-surface-2 border border-white/10 flex items-center justify-center shrink-0 mb-1">
                      <span className="text-text-2 text-[10px] font-semibold">Bot</span>
                    </div>
                    <div className="bg-surface border border-white/10 text-text-1 px-5 py-3.5 rounded-2xl rounded-tl-sm shadow-sm max-w-[85%] text-[15px] leading-relaxed">
                      {q.label || 'Untitled question'}
                      {(q.required === 1 || q.required === true) && <span className="text-danger ml-1">*</span>}
                    </div>
                  </div>
                  <div className="flex justify-end pr-2">
                    <div className="bg-primary/20 text-white/80 px-5 py-3 rounded-2xl rounded-tr-sm shadow-sm max-w-[85%] text-[15px] border border-primary/20">
                      Your answer…
                    </div>
                  </div>
                </div>
              ))
            )}

            <div className="text-center text-[11px] font-semibold text-text-2 opacity-70 pt-2">
              Preview is read-only. Use the builder to edit questions.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-[100dvh] bg-base relative ${device === 'mobile' ? 'text-[15px]' : ''}`}>
      <div className="max-w-[760px] mx-auto px-4 py-10 sm:py-12 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-display font-semibold mb-3 text-text-1">
            {draft.title}
          </h1>
          {draft.description ? (
            <p className="text-base text-text-2 leading-relaxed max-w-[540px] mx-auto">{draft.description}</p>
          ) : null}
          <p className="text-[11px] font-semibold text-text-2 opacity-70 mt-4">
            Preview is read-only. Use the builder to edit questions.
          </p>
        </div>

        <div className="space-y-6 pb-10">
          {draft.questions.length === 0 ? (
            <div className="text-center text-text-2 text-sm bg-surface border border-white/10 rounded-2xl p-8">
              Add questions to see them in the preview.
            </div>
          ) : (
            draft.questions.map((q, idx) => (
              <div key={q.id} className="rounded-xl p-6 sm:p-7 bg-surface border border-white/10">
                <div className="text-xs font-semibold mb-5 text-text-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-surface-2 border border-white/10 text-primary text-[11px]">
                      {idx + 1}
                    </span>
                    Question
                  </span>
                  {(q.required === 1 || q.required === true) && (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-danger/10 text-danger border border-danger/20">
                      Required
                    </span>
                  )}
                </div>
                <div className="text-text-1 pointer-events-none select-none opacity-95">
                  <QuestionRenderer question={q} value={''} onChange={() => {}} error={null} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

