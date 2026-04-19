import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicSurvey } from '../api/surveyApi';
import { submitResponse } from '../api/responseApi';
import { useSurveyEngine } from '../hooks/useSurveyEngine';
import { useWebSocket } from '../hooks/useWebSocket';
import Spinner from '../components/ui/Spinner';
import { Send, CheckCircle2, Bot, User } from 'lucide-react';

const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-4 py-3 bg-surface border border-[var(--color-border)] rounded-2xl rounded-tl-sm w-fit shadow-sm">
    <span className="w-1.5 h-1.5 bg-text-2/60 rounded-full animate-pulse" />
    <span className="w-1.5 h-1.5 bg-text-2/60 rounded-full animate-pulse" />
    <span className="w-1.5 h-1.5 bg-text-2/60 rounded-full animate-pulse" />
  </div>
);

export default function ConversationalSurveyPage() {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [globalError, setGlobalError] = useState('');
  
  const [isTyping, setIsTyping] = useState(false);
  const [localValue, setLocalValue] = useState('');
  
  const startTimeRef = useRef(Date.now());
  const messagesEndRef = useRef(null);
  const sessionIdRef = useRef(crypto.randomUUID());
  
  const { sendMessage } = useWebSocket();

  const { 
    answers, 
    answerQuestion, 
    visibleQuestions, 
    currentIndex, 
    goNext, 
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
        // Give a slight delay before showing the first question to simulate bot typing
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 800);
        
        sendMessage({
          type: 'survey:start',
          sessionId: sessionIdRef.current,
          surveyId: data.survey.id,
          surveyTitle: data.survey.title,
          respondent: 'Live Active User',
          time: Date.now()
        });
      } catch (err) {
        setGlobalError('Survey not found or no longer available');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentIndex, isTyping, submitted, visibleQuestions.length]);

  const currentQuestion = visibleQuestions[currentIndex] || null;
  const { percent } = getProgress();
  
  const handleAnswerSubmit = async (val) => {
    if (!currentQuestion) return;
    
    // Save answer
    answerQuestion(currentQuestion.id, val);
    setLocalValue('');

    sendMessage({
      type: 'survey:progress',
      sessionId: sessionIdRef.current,
      surveyId: id,
      question: currentQuestion.label,
      answer: val,
      percent: percent, // Current percent BEFORE going next
    });

    // Simulate thinking/typing before next question
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 600));
    setIsTyping(false);

    if (currentIndex < visibleQuestions.length - 1) {
      goNext();
    } else {
      handleSubmit({ [currentQuestion.id]: val });
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!localValue.trim() && (currentQuestion?.required === 1 || currentQuestion?.required === true)) return;
    handleAnswerSubmit(localValue);
  };

  const handleSubmit = async (overrideAnswers = {}) => {
    try {
      setSubmitting(true);
      const completionTimeMs = Date.now() - startTimeRef.current;
      const answerArray = getSubmissionPayload(overrideAnswers);
      await submitResponse(id, answerArray, completionTimeMs);
      setSubmitted(true);
      
      sendMessage({
        type: 'survey:complete',
        sessionId: sessionIdRef.current,
        surveyId: id,
        time: Date.now()
      });
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
        <div className="text-center bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-8 max-w-sm w-full shadow-sm">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="text-lg font-bold mb-1 text-[var(--text-primary)]">Survey Unavailable</h2>
          <p className="text-sm text-[var(--text-secondary)]">This survey doesn&apos;t exist or is closed.</p>
        </div>
      </div>
    );
  }

  const historyQuestions = visibleQuestions.slice(0, currentIndex + (isTyping ? 0 : 1));

  return (
    <div className="h-[100dvh] flex flex-col bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-surface-2 via-base to-base text-text-1 overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-[3px] z-50 bg-white/5">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${Math.max(2, percent)}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex-none px-6 py-4 bg-surface/40 backdrop-blur-xl border-b border-white/5 shadow-sm z-40 sticky top-0 relative">
        <h1 className="text-sm sm:text-base font-semibold text-text-1 truncate drop-shadow-sm">
          {survey?.title}
        </h1>
        <p className="text-xs font-semibold text-primary mt-0.5 flex items-center gap-1.5 drop-shadow-sm">
          <Bot size={12}/> Survey Assistant
        </p>
      </div>

      {/* Chat Thread Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8 relative">
        <div className="max-w-2xl mx-auto flex flex-col space-y-6">
          
          {historyQuestions.map((q, idx) => (
            <div key={`hist-${q.id}`} className="space-y-4">
              <div className="flex items-end gap-2 animate-slide-in drop-shadow-md">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mb-1 shadow-lg border border-white/10 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                <Bot size={16} className="text-white"/>
              </div>
              <div className="bg-surface-2 border border-white/10 px-5 py-3.5 rounded-2xl rounded-tl-sm shadow-md max-w-[85%] text-[15px] leading-relaxed relative">
                {q.label}
                {(q.required === 1 || q.required === true) && <span className="text-danger ml-1 font-bold">*</span>}
              </div>
            </div>

              {idx < currentIndex && answers[q.id] !== undefined && (
                <div className="flex justify-end pr-2 animate-slide-in">
                  <div className="bg-primary/20 text-primary border border-primary/20 px-5 py-3 rounded-2xl rounded-tr-sm shadow-sm max-w-[85%] text-[15px]">
                    {answers[q.id]}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isTyping && !submitted && (
            <div className="flex items-end gap-2 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mb-1 shadow-lg border border-white/10 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                <Bot size={16} className="text-white"/>
              </div>
              <TypingIndicator />
            </div>
          )}

          {submitted && (
            <div className="flex justify-center mt-10 mb-20">
              <div className="bg-surface px-8 py-6 rounded-2xl shadow-md border border-[var(--color-border)] text-center">
                <div className="w-14 h-14 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-4 border border-success/30">
                  <CheckCircle2 className="w-7 h-7 text-success" />
                </div>
                <h2 className="text-lg font-semibold text-text-1 mb-2">You're all set!</h2>
                <p className="text-text-2 text-sm">Your responses have been successfully recorded.</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Interactive Input Area at bottom */}
      {/* Input Dock */}
      {!submitted && currentQuestion && (
        <div className="flex-none bg-surface/30 backdrop-blur-xl border-t border-white/5 p-4 sm:p-6 z-40 relative">
          <div className="max-w-2xl mx-auto">
            {currentQuestion.type === 'mcq' && Array.isArray(currentQuestion.options) && (
              <div className="flex flex-wrap gap-2 justify-end">
                {currentQuestion.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleAnswerSubmit(opt)}
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-full text-sm font-semibold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all shadow-sm active:scale-95 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.type === 'rating' && (
              <div className="flex items-center justify-end gap-2 sm:gap-4">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => handleAnswerSubmit(String(n))}
                    disabled={submitting}
                    className="text-[40px] drop-shadow-sm transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:text-amber-400 active:scale-95 text-white/5"
                  >
                     ★
                  </button>
                ))}
              </div>
            )}

            {(currentQuestion.type === 'text_short' || currentQuestion.type === 'text' || currentQuestion.type === 'text_long') && (
              <form onSubmit={handleTextSubmit} className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Type your answer..."
                  value={localValue}
                  onChange={(e) => setLocalValue(e.target.value)}
                  disabled={submitting}
                  className="flex-1 bg-surface-2 border border-white/10 focus:border-primary/50 focus:bg-surface-3 px-6 py-3.5 rounded-full text-[15px] outline-none transition-all placeholder:text-text-2/50 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={submitting || (!localValue.trim() && (currentQuestion.required === 1 || currentQuestion.required === true))}
                  className="w-12 h-12 bg-primary hover:bg-primary/90 text-white rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all active:scale-95"
                >
                  {submitting ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-custom-spin" /> : <Send size={18} className="translate-x-[1px]" />}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {globalError && !survey && (
        <div className="flex-none bg-red-50 text-red-600 p-4 font-semibold text-center border-t border-red-100 text-sm">
          {globalError}
        </div>
      )}
    </div>
  );
}
