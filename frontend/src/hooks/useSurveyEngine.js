import { useState, useCallback, useMemo } from 'react';

export function useSurveyEngine(questions) {
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const evaluateRules = useCallback((allQuestions, currentAnswers) => {
    const hidden = new Set();
    const forced = new Set();

    for (const q of allQuestions) {
      if (!q.logic_rules || q.logic_rules.length === 0) continue;

      const myAnswer = currentAnswers[q.id];
      if (myAnswer === undefined || myAnswer === '') continue;

      for (const rule of q.logic_rules) {
        let match = false;

        if (rule.if_answer_equals && String(myAnswer) === String(rule.if_answer_equals)) {
          match = true;
        }
        if (rule.if_answer_contains && String(myAnswer).toLowerCase().includes(rule.if_answer_contains.toLowerCase())) {
          match = true;
        }
        if (rule.if_answer_greater_than && !isNaN(myAnswer) && Number(myAnswer) > Number(rule.if_answer_greater_than)) {
          match = true;
        }
        if (rule.if_answer_less_than && !isNaN(myAnswer) && Number(myAnswer) < Number(rule.if_answer_less_than)) {
          match = true;
        }
        if (rule.if_answer_is_empty && (!myAnswer || String(myAnswer).trim() === '')) {
          match = true;
        }

        if (match) {
          if (rule.then_skip_to_question_id) {
            const targetIdx = allQuestions.findIndex((qq) => qq.id === rule.then_skip_to_question_id);
            const currentIdx = allQuestions.findIndex((qq) => qq.id === q.id);
            if (targetIdx > currentIdx) {
              for (let i = currentIdx + 1; i < targetIdx; i++) {
                hidden.add(allQuestions[i].id);
              }
            }
          }

          if (rule.then_show_question_id) {
            forced.add(rule.then_show_question_id);
          }

          if (rule.then_end_survey) {
            const currentIdx = allQuestions.findIndex((qq) => qq.id === q.id);
            for (let i = currentIdx + 1; i < allQuestions.length; i++) {
              hidden.add(allQuestions[i].id);
            }
          }
        }
      }
    }

    return { hidden, forced };
  }, []);

  const visibleQuestions = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    const { hidden } = evaluateRules(questions, answers);
    return questions.filter((q) => !hidden.has(q.id));
  }, [questions, answers, evaluateRules]);

  const answerQuestion = useCallback((questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    // Automatically advance to the next visible question is handled by the component using currentIndex
  }, []);
  
  const goNext = useCallback(() => {
     setCurrentIndex(prev => prev + 1);
  }, []);

  const goBack = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const getProgress = useCallback(() => {
    const total = visibleQuestions.length;
    const current = Math.min(currentIndex + 1, total);
    const percent = total === 0 ? 0 : Math.round((current / total) * 100);
    return { current, total, percent };
  }, [currentIndex, visibleQuestions.length]);

  const isComplete = currentIndex >= visibleQuestions.length && visibleQuestions.length > 0;

  const getSubmissionPayload = useCallback(() => {
    return visibleQuestions
      .filter(q => answers[q.id] !== undefined && answers[q.id] !== '')
      .map((q) => ({
        question_id: q.id,
        answer_value: answers[q.id],
      }));
  }, [answers, visibleQuestions]);

  const resetAnswers = useCallback(() => {
    setAnswers({});
    setCurrentIndex(0);
  }, []);

  return {
    allQuestions: questions || [],
    visibleQuestions,
    answers,
    currentIndex,
    answerQuestion,
    goNext,
    goBack,
    getProgress,
    isComplete,
    getSubmissionPayload,
    resetAnswers,
  };
}
