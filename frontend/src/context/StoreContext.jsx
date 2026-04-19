import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getSurveys, getSurvey, getIndividualResponses } from '../api/surveyApi';
import { scoreResponseQuality } from '../utils/insightEngine';
import { useAuth } from './AuthContext';

const StoreContext = createContext(null);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};

const DEFAULT_SETTINGS = {
  spamDetection: true,
  minTextLength: 3,
  duplicateFilter: true,
  defaultChart: 'bar',
  exportFormat: 'csv',
};

const loadSettings = () => {
  try {
    const stored = localStorage.getItem('surveylabs_settings');
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const StoreProvider = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [settings, setSettingsState] = useState(loadSettings);
  const [surveys, setSurveys] = useState([]);
  // responsesBySurvey: Map<surveyId, response[]>
  const [responsesBySurvey, setResponsesBySurvey] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Keep latest settings accessible in refreshData without recreating it
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const updateSettings = useCallback((newSettings) => {
    setSettingsState(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('surveylabs_settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const refreshData = useCallback(async () => {
    if (isUpdating) return; // Prevent overlapping fetches
    setIsUpdating(true);
    try {
      const surveysList = await getSurveys() || [];
      setSurveys(surveysList);

      const s = settingsRef.current;
      const newResponsesBySurvey = {};
      let allResponses = [];
      let totalRatings = 0;
      let ratingSum = 0;
      let dateCounts = {};
      let mcqAnswers = {};
      let ratingBuckets = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      for (const survey of surveysList) {
        // Use actual response fetching — don't trust backend cached count
        const [surveyDetails, rs] = await Promise.all([
          getSurvey(survey.id),
          getIndividualResponses(survey.id).catch(() => [])
        ]);

        const responseList = Array.isArray(rs?.responses) ? rs.responses : (Array.isArray(rs) ? rs : []);
        let filtered = responseList;

        // Apply settings filters
        if (s.spamDetection) {
          filtered = filtered.filter(r => {
            const q = scoreResponseQuality(r, surveyDetails?.questions || [], s);
            return q.quality !== 'spam';
          });
        }

        if (s.duplicateFilter) {
          const seen = new Set();
          filtered = filtered.filter(r => {
            const sig = JSON.stringify((r.answers || []).map(a => a.answer_value).sort());
            if (seen.has(sig)) return false;
            seen.add(sig);
            return true;
          });
        }

        newResponsesBySurvey[survey.id] = filtered;
        allResponses = allResponses.concat(filtered);

        filtered.forEach(r => {
          // Trend
          const d = r.submitted_at ? new Date(r.submitted_at).toISOString().split('T')[0] : null;
          if (d) dateCounts[d] = (dateCounts[d] || 0) + 1;

          // Distributions
          (r.answers || []).forEach(a => {
            const q = (surveyDetails?.questions || []).find(q => q.id === a.question_id);
            if (!q) return;
            if (q.type === 'rating') {
              const val = parseInt(a.answer_value);
              if (val >= 1 && val <= 5) {
                totalRatings++;
                ratingSum += val;
                ratingBuckets[val]++;
              }
            }
            if (q.type === 'mcq' && a.answer_value) {
              const ans = String(a.answer_value).substring(0, 30);
              mcqAnswers[ans] = (mcqAnswers[ans] || 0) + 1;
            }
          });
        });
      }

      // Build chart datasets
      const sortedDates = Object.keys(dateCounts).sort();
      const responseTrend = sortedDates.slice(-14).map(d => ({
        name: new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        val: dateCounts[d]
      }));

      const mcqDistribution = Object.entries(mcqAnswers)
        .sort((a, b) => b[1] - a[1]).slice(0, 8)
        .map(([name, val]) => ({ name, val }));

      const ratingDistribution = [1, 2, 3, 4, 5].map(k => ({
        name: `${k}★`, val: ratingBuckets[k]
      }));

      setResponsesBySurvey(newResponsesBySurvey);
      setAnalytics({
        totalResponses: allResponses.length,
        totalSurveys: surveysList.length,
        avgRating: totalRatings > 0 ? (ratingSum / totalRatings).toFixed(1) : null,
        responseTrend,
        mcqDistribution,
        ratingDistribution,
        hasData: allResponses.length > 0
      });
    } catch (err) {
      console.error('Store sync failed:', err);
    } finally {
      setIsLoaded(true);
      setIsUpdating(false);
    }
  }, []); // No settings dep — uses ref to avoid poll restarts on every settings change

  // Poll every 30s (not 5s — that was too aggressive for N surveys * M API calls)
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let cancelled = false;
    const run = () => { if (!cancelled) refreshData(); };
    run();
    const interval = setInterval(run, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [refreshData, isAuthenticated, authLoading]);

  // Helper: get real response count for a specific survey
  const getResponseCount = useCallback((surveyId) => {
    return (responsesBySurvey[surveyId] || []).length;
  }, [responsesBySurvey]);

  const activeSurveysCount = useMemo(() => {
    return (Array.isArray(surveys) ? surveys : []).filter((s) => Number(s?.is_active) === 1).length;
  }, [surveys]);

  const value = useMemo(() => ({
    settings,
    updateSettings,
    surveys,
    activeSurveysCount,
    responsesBySurvey,
    analytics,
    isLoaded,
    isUpdating,
    refreshData,
    getResponseCount,
  }), [settings, updateSettings, surveys, activeSurveysCount, responsesBySurvey, analytics, isLoaded, isUpdating, refreshData, getResponseCount]);

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};
