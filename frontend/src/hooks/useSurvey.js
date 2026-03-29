import { useState, useEffect, useCallback } from 'react';
import { getSurvey } from '../api/surveyApi';

export function useSurvey(surveyId) {
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSurvey = useCallback(async () => {
    if (!surveyId) return;
    try {
      setLoading(true);
      setError('');
      const data = await getSurvey(surveyId);
      setSurvey(data.survey);
      setQuestions(data.questions);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load survey');
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    fetchSurvey();
  }, [fetchSurvey]);

  return { survey, questions, loading, error, refetch: fetchSurvey };
}
