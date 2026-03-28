import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicSurvey } from '../api/surveyApi';
import { submitResponse } from '../api/responseApi';
import { useSurveyEngine } from '../hooks/useSurveyEngine';
import Spinner from '../components/ui/Spinner';

export default function ConversationalSurveyPage() {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [error, setError] = useState('');
  const [slideDirection, setSlideDirection] = useState('right'); // 'right' or 'left'
  const startTimeRef = useRef(Date.now());

  const { 
    answers, 
    answerQuestion, 
    visibleQuestions, 
    currentIndex, 
    goNext, 
    goBack, 
    getProgress,
    getSubmissionPayload
  } = useSurveyEngine(questions);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getPublicSurvey(id);
        setSurvey(data.survey);
        setQuestions(data.questions);
        startTimeRef.current = Date.now();
      } catch (err) {
        console.error('Failed to load conversational survey:', err);
        setGlobalError('Survey not found or no longer available');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const currentQuestion = visibleQuestions[currentIndex] || null;
  const { percent } = getProgress();
  
  const handleNext = useCallback(() => {
    if (!currentQuestion) return;
    const val = answers[currentQuestion.id];
    const isRequired = currentQuestion.required === 1 || currentQuestion.required === true;

    if (isRequired && (val === undefined || String(val).trim() === '')) {
      setError('This question is required');
      return;
    }
    setError('');

    if (currentIndex < visibleQuestions.length - 1) {
      setSlideDirection('right');
      goNext();
    } else {
      handleSubmit();
    }
  }, [currentQuestion, answers, currentIndex, visibleQuestions.length, goNext]);

  const handleBack = () => {
    setError('');
    setSlideDirection('left');
    goBack();
  };

  useEffect(() => {
    const handler = (e) => {
      if (document.activeElement.tagName === 'BUTTON' || document.activeElement.tagName === 'TEXTAREA') return;
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNext]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const completionTimeMs = Date.now() - startTimeRef.current;
      const answerArray = getSubmissionPayload();
      await submitResponse(id, answerArray, completionTimeMs);
      setSubmitted(true);
    } catch (err) {
      setGlobalError(typeof err === 'string' ? err : 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--bg-base)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (globalError && !survey) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-4 bg-[var(--bg-base)]">
        <div className="text-center bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-8 max-w-[400px] w-full shadow-[var(--shadow-md)]">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Survey Unavailable</h2>
          <p className="text-[15px] text-[var(--text-secondary)]">This survey doesn&apos;t exist or is closed.</p>
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

  const value = currentQuestion ? (answers[currentQuestion.id] || '') : '';
  const isRequired = currentQuestion?.required === 1 || currentQuestion?.required === true;
  const isNextDisabled = submitting || !currentQuestion || (isRequired && (value === undefined || String(value).trim() === ''));

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--bg-base)]">
      {/* 4px Progress Bar */}
      <div className="h-[4px] w-full bg-[var(--border)] relative overflow-hidden shrink-0">
        <div 
          className="absolute inset-y-0 left-0 bg-[var(--brand)] transition-all duration-400 ease-out" 
          style={{ width: `${Math.max(2, percent)}%` }} 
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 overflow-x-hidden relative">
        <div className="w-full max-w-[560px] mx-auto flex flex-col items-stretch">
          
          {/* Back Button (above card) */}
          <div className="mb-6 min-h-[40px]">
            {currentIndex > 0 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="px-4 py-2 rounded-[var(--radius-sm)] text-sm font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex flex-row items-center gap-1.5"
              >
                ← Prev
              </button>
            )}
          </div>

          {currentQuestion && (
            <div 
              key={currentQuestion.id} 
              className={`w-full ${slideDirection === 'right' ? 'animate-slide-right' : 'animate-slide-in'}`}
            >
               <h2 className="text-[26px] md:text-[32px] font-semibold leading-tight text-[var(--text-primary)] mb-8 tracking-tight">
                 {currentQuestion.label}
                 {isRequired && <span className="ml-2 text-[var(--danger)]">*</span>}
               </h2>

              <div className="w-full mb-8">
                {currentQuestion.type === 'mcq' && Array.isArray(currentQuestion.options) && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((opt) => {
                      const selected = value === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => { answerQuestion(currentQuestion.id, opt); setError(''); }}
                          className="w-full text-left rounded-[var(--radius-md)] px-5 py-4 text-[16px] font-medium transition-all duration-150 flex items-center justify-between group"
                          style={{
                            background: selected ? 'var(--brand-light)' : 'var(--bg-surface)',
                            border: selected ? '2px solid var(--brand)' : '1px solid var(--border)',
                            color: selected ? 'var(--brand)' : 'var(--text-primary)',
                            boxShadow: selected ? 'var(--shadow-sm)' : 'none'
                          }}
                        >
                          {opt}
                          {selected && (
                            <div className="w-6 h-6 shrink-0 rounded-full bg-[var(--brand)] flex items-center justify-center animate-scale-bounce">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {(currentQuestion.type === 'text_short' || currentQuestion.type === 'text') && (
                  <input
                    type="text"
                    autoFocus
                    value={value}
                    onChange={(e) => { answerQuestion(currentQuestion.id, e.target.value); setError(''); }}
                    placeholder="Type your answer here..."
                    className="w-full rounded-[var(--radius-md)] px-5 py-4 text-[16px] outline-none transition-shadow border focus:border-[var(--brand)] focus:ring-[3px] focus:ring-[var(--brand-light)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                    style={{ borderColor: 'var(--border)' }}
                  />
                )}

                {currentQuestion.type === 'text_long' && (
                  <textarea
                    autoFocus
                    rows={5}
                    value={value}
                    onChange={(e) => { answerQuestion(currentQuestion.id, e.target.value); setError(''); }}
                    placeholder="Type your answer here..."
                    className="w-full rounded-[var(--radius-md)] px-5 py-4 text-[16px] outline-none resize-none transition-shadow border focus:border-[var(--brand)] focus:ring-[3px] focus:ring-[var(--brand-light)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                    style={{ borderColor: 'var(--border)' }}
                  />
                )}

                {currentQuestion.type === 'rating' && (
                  <div className="flex items-center justify-between gap-2 sm:gap-4 py-4 max-w-sm mx-auto">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const selected = parseInt(value) >= n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => { answerQuestion(currentQuestion.id, String(n)); setError(''); }}
                          className="text-4xl sm:text-5xl transition-all duration-200 hover:scale-110 active:scale-95 flex-shrink-0"
                          style={{ color: selected ? '#FBBF24' : 'var(--border-strong)' }}
                        >
                          ★
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-6 text-[14px] font-bold text-center bg-[var(--bad-bg)] text-[var(--danger)] py-3 px-4 rounded-[var(--radius-sm)] animate-fade-in border border-[var(--danger)]/20">
                  {error}
                </div>
              )}

              {/* Next Button is exactly 48px height full width */}
              <button
                type="button"
                onClick={handleNext}
                disabled={submitting || isNextDisabled}
                className="w-full h-[48px] rounded-[var(--radius-md)] text-[16px] font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 group shadow-[var(--shadow-sm)]"
                style={{ background: 'var(--brand)' }}
              >
                {submitting && <div className="animate-custom-spin h-5 w-5 border-[3px] border-white/60 border-t-white rounded-full" />}
                {submitting ? 'Submitting...' : currentIndex === visibleQuestions.length - 1 ? 'Submit Response' : 'Continue'}
              </button>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
