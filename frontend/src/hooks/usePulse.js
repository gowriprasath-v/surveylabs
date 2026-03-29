import { useState, useEffect, useRef, useCallback } from 'react';
import client from '../api/client';

export function usePulse(surveyId) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasNewResponse, setHasNewResponse] = useState(false);

  const intervalRef = useRef(null);
  const prevTotalRef = useRef(0);
  const timeoutRef = useRef(null);

  const fetchPulse = useCallback(async () => {
    if (!surveyId) return;
    try {
      const response = await client.get(`/admin/surveys/${surveyId}/pulse`);
      const newData = response.data.data;
      
      if (prevTotalRef.current > 0 && newData.total_responses > prevTotalRef.current) {
        setHasNewResponse(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setHasNewResponse(false), 3000);
      }
      
      prevTotalRef.current = newData.total_responses;
      setData(newData);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to fetch pulse');
    } finally {
      setIsLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    fetchPulse();
    intervalRef.current = setInterval(fetchPulse, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [fetchPulse]);

  return { data, isLoading, error, hasNewResponse };
}
