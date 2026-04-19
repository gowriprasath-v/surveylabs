import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, ArrowRight, Activity, Zap } from 'lucide-react';
import { getPublicSurvey } from '../api/surveyApi';
import { submitResponse } from '../api/responseApi';
import { useSurveyEngine } from '../hooks/useSurveyEngine';
import QuestionRenderer from '../components/public/QuestionRenderer';

export default function PublicSurveyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const startTimeRef = useRef(Date.now());

  const { answers, answerQuestion, visibleQuestions } = useSurveyEngine(questions);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setGlobalError('');
        const data = await getPublicSurvey(id);

        if (data.survey.mode === 'conversational' && !location.pathname.endsWith('/convo')) {
          navigate(`/s/${id}/convo`, { replace: true });
          return;
        }

        setSurvey(data.survey);
        setQuestions(data.questions);
        startTimeRef.current = Date.now();
      } catch (err) {
        setGlobalError(typeof err === 'string' ? err : 'Survey not found or no longer available');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate, location.pathname]);

  // Listen for live preview sync when in builder
  useEffect(() => {
    const isPreview = new URLSearchParams(location.search).get('preview') === 'true';
    if (!isPreview) return;

    const handleMessage = (e) => {
      if (e.data?.type === 'LIVE_PREVIEW_SYNC') {
        const { title, description, questions: newQs } = e.data.payload;
        setSurvey(prev => ({ ...prev, title, description }));
        setQuestions(newQs.map(q => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options || '[]') : q.options,
        })));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [location.search]);

  const handleChange = (questionId, value) => {
    answerQuestion(questionId, value);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const answeredRequired = visibleQuestions.filter(
    (q) => (q.required === 1 || q.required === true) && answers[q.id] !== undefined && String(answers[q.id]).trim() !== ''
  ).length;
  const totalRequired = visibleQuestions.filter((q) => q.required === 1 || q.required === true).length;
  const progress = totalRequired > 0 ? (answeredRequired / totalRequired) * 100 : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');

    const newErrors = {};
    visibleQuestions.forEach((q) => {
      if (q.required === 1 || q.required === true) {
        const val = answers[q.id];
        if (val === undefined || String(val).trim() === '') {
          newErrors[q.id] = 'This question is required';
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstId = visibleQuestions.find((q) => newErrors[q.id])?.id;
      if (firstId) {
        document.getElementById(`q-${firstId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      setSubmitting(true);
      const completionTimeMs = Date.now() - startTimeRef.current;
      
      const payload = visibleQuestions
        .filter((q) => answers[q.id] !== undefined && String(answers[q.id]).trim() !== '')
        .map((q) => ({ question_id: q.id, answer_value: String(answers[q.id]) }));
        
      await submitResponse(id, payload, completionTimeMs);
      setSubmitted(true);
    } catch (err) {
      setGlobalError(typeof err === 'string' ? err : 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-base">
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-custom-spin" />
      </div>
    );
  }

  if (globalError && !survey && !submitted) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-4 bg-base">
        <div className="text-center bg-surface border border-white/5 rounded-xl p-8 max-w-[400px] w-full shadow-lg relative overflow-hidden group">
          <div className="absolute -inset-10 bg-danger/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10" />
          <AlertTriangle className="mx-auto text-danger w-12 h-12 mb-4 opacity-80" />
          <h2 className="text-xl font-display font-bold mb-2 text-text-1">Survey Unavailable</h2>
          <p className="text-sm text-text-2">{globalError}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-4 bg-base">
        <div className="bg-surface border border-[var(--color-border)] rounded-2xl p-10 max-w-[440px] w-full text-center shadow-md">
          <div className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center bg-success/15 border border-success/30">
             <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-display font-semibold mb-3 text-text-1">Thank you!</h2>
          <p className="text-sm mb-8 text-text-2">Your response is greatly appreciated and has been securely recorded.</p>
          <div className="inline-flex items-center gap-2 text-[10px] font-bold text-text-2/50 tracking-widest uppercase">
             <Zap size={10} className="text-primary" /> Powered by SurveyLabs
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-base relative">
      <div className="sticky top-0 z-50 h-1 bg-surface-2">
        <div className="h-full transition-all duration-700 ease-out bg-primary" style={{ width: `${Math.max(2, progress)}%` }} />
      </div>

      <div className="max-w-[760px] mx-auto px-4 py-12 sm:py-20 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-display font-semibold mb-4 text-text-1">{survey.title}</h1>
          {survey.description && <p className="text-base text-text-2 leading-relaxed max-w-[540px] mx-auto">{survey.description}</p>}
        </div>

        {globalError && (
          <div className="mb-8 px-4 py-3 rounded-lg text-sm bg-danger/10 text-danger border border-danger/20 text-center font-bold flex items-center justify-center gap-2">
            <AlertTriangle size={16} /> {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            {visibleQuestions.map((q, idx) => (
              <div
                key={q.id}
                id={`q-${q.id}`}
                className="rounded-xl p-6 sm:p-7 bg-surface border border-[var(--color-border)]"
              >
                <div className="text-xs font-semibold mb-5 text-text-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-surface-2 border border-[var(--color-border)] text-primary text-[11px]">{idx + 1}</span>
                    Question
                  </span>
                  {(q.required === 1 || q.required === true) && (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-danger/10 text-danger border border-danger/20">Required</span>
                  )}
                </div>
                <div className="text-text-1">
                  <QuestionRenderer
                    question={q}
                    value={answers[q.id] || ''}
                    onChange={handleChange}
                    error={errors[q.id]}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8 flex justify-center pb-20">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto sm:min-w-[280px] h-12 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed border border-primary/50 bg-primary"
            >
              {submitting ? (
                 <div className="h-5 w-5 border-2 border-white/60 border-t-white rounded-full animate-custom-spin" />
              ) : (
                 <>Submit Response <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
