import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getPublicSurvey } from '../api/surveyApi';
import { submitResponse } from '../api/responseApi';
import { useSurveyEngine } from '../hooks/useSurveyEngine';
import QuestionRenderer from '../components/public/QuestionRenderer';
import Spinner from '../components/ui/Spinner';

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
      <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-[var(--bg-base)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (globalError && !survey && !submitted) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-4 bg-[var(--bg-base)]">
        <div className="text-center bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-8 max-w-[400px] w-full shadow-[var(--shadow-md)]">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Survey Unavailable</h2>
          <p className="text-[15px] text-[var(--text-secondary)]">{globalError}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-4 bg-[var(--bg-base)]">
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-10 max-w-[440px] w-full text-center shadow-[var(--shadow-md)] animate-fade-in">
          <div className="mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center bg-[var(--bg-base)] border border-[var(--border)] shadow-[var(--shadow-sm)]">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'check-draw 0.5s ease-out forwards' }}>
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 className="text-[28px] font-bold mb-3 text-[var(--text-primary)] tracking-tight">Thank you!</h2>
          <p className="text-[16px] mb-8 text-[var(--text-secondary)]">Your response has been recorded.</p>
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] tracking-wider uppercase">
             <span className="text-[var(--brand)]">◆</span> SurveyLab
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-base)]">
      <div className="sticky top-0 z-10 h-[4px] bg-[var(--border)]">
        <div className="h-full transition-all duration-300 ease-out bg-[var(--brand)]" style={{ width: `${Math.max(2, progress)}%` }} />
      </div>

      <div className="max-w-[640px] mx-auto px-4 py-12 sm:py-20">
        <div className="text-center mb-12 animate-slide-in">
          <h1 className="text-[32px] sm:text-[40px] leading-tight font-bold mb-4 text-[var(--text-primary)] tracking-tight">{survey.title}</h1>
          {survey.description && <p className="text-[16px] text-[var(--text-secondary)] leading-relaxed max-w-[500px] mx-auto">{survey.description}</p>}
        </div>

        {globalError && (
          <div className="mb-8 px-4 py-3 rounded-[var(--radius-md)] text-sm bg-[var(--bad-bg)] text-[var(--danger)] border border-[var(--danger)] text-center font-bold">
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <div className="space-y-6">
            {visibleQuestions.map((q, idx) => (
              <div key={q.id} id={`q-${q.id}`} className="rounded-[var(--radius-lg)] p-6 sm:p-8 bg-[var(--bg-surface)] border border-[var(--border)] shadow-[var(--shadow-sm)]">
                <div className="text-[12px] font-bold uppercase tracking-wider mb-5 text-[var(--text-muted)] flex items-center justify-between">
                  <span>
                     Question {idx + 1} of {visibleQuestions.length}
                  </span>
                  {(q.required === 1 || q.required === true) && (
                     <span className="text-[11px] px-2 py-0.5 rounded-sm bg-[var(--bg-muted)] text-[var(--danger)]">Required</span>
                  )}
                </div>
                <QuestionRenderer
                  question={q}
                  value={answers[q.id] || ''}
                  onChange={handleChange}
                  error={errors[q.id]}
                />
              </div>
            ))}
          </div>

          <div className="pt-8 flex justify-center">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-[320px] h-[54px] rounded-[var(--radius-md)] text-[16px] font-bold text-white transition-all shadow-[var(--shadow-md)] flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 hover:shadow-[var(--shadow-lg)] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              style={{ background: submitting ? 'var(--border-strong)' : 'var(--brand)' }}
            >
              {submitting && <div className="h-5 w-5 border-2 border-white/60 border-t-white rounded-full animate-custom-spin" />}
              {submitting ? 'Submitting...' : 'Submit Response'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
