import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Plus, Bell, Activity, CheckCircle2, AlertTriangle, Users, FileText, ChevronRight, RefreshCw } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { getGlobalAnalytics } from '../api/analyticsApi';
import { useWebSocket } from '../hooks/useWebSocket';

const getRateColor = (rate) => {
  if (rate >= 80) return '#10B981';
  if (rate >= 60) return '#F59E0B';
  return '#EF4444';
};

const dedupeFeed = (items) => {
  const seen = new Set();
  const result = [];
  (Array.isArray(items) ? items : []).forEach((item) => {
    const key = String(item?.id || '') || `${item?.surveyId}-${item?.time}-${item?.quality_label}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push(item);
  });
  return result;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  usePageTitle('Dashboard');
  const currentDate = format(new Date(), 'EEEE, MMMM do');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [error, setError] = useState('');
  const [liveFeed, setLiveFeed] = useState([]);
  const [volumeRange, setVolumeRange] = useState('monthly');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifPos, setNotifPos] = useState({ top: 0, left: 0 });
  const [performanceMetric, setPerformanceMetric] = useState('responses');
  const [notifClearedAt, setNotifClearedAt] = useState(null);
  const notifButtonRef = useRef(null);

  const fetchAnalytics = useCallback(async ({ background = false } = {}) => {
    try {
      setError('');
      if (background) setRefreshing(true);
      const res = await getGlobalAnalytics();
      setData(res);
      if (res.recentResponses) {
        const normalized = (Array.isArray(res.recentResponses) ? res.recentResponses : []).map((r) => ({
          id: r.id,
          surveyId: r.surveyId || r.survey_id,
          surveyTitle: r.surveyTitle || r.survey_title || r.surveyTitle || 'Survey',
          time: r.time || r.submitted_at || r.created_at || new Date().toISOString(),
          valid: r.valid ?? ((r.quality_label || 'good') !== 'spam'),
          quality_label: r.quality_label || 'good',
          respondent_ip: r.respondent_ip || 'Anonymous',
        }));
        setLiveFeed(dedupeFeed(normalized).slice(0, 15));
      }
      setLastUpdatedAt(new Date().toISOString());
    } catch (err) {
      setError('Unable to refresh dashboard data right now.');
      console.error(err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Poll as a fallback (WebSocket is best-effort; polling guarantees freshness)
  useEffect(() => {
    let cancelled = false;
    const intervalMs = 30000;

    const tick = () => {
      if (cancelled) return;
      if (document.visibilityState !== 'visible') return;
      fetchAnalytics({ background: true });
    };

    const interval = window.setInterval(tick, intervalMs);
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        fetchAnalytics({ background: true });
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [fetchAnalytics]);

  const surveysRef = useRef([]);
  useEffect(() => {
    if (data?.topSurveys) surveysRef.current = data.topSurveys;
  }, [data]);

  const onWsMessage = useCallback((msg) => {
    if (msg.type === 'response:new') {
      const surveyMatch = surveysRef.current.find(s => s.id === msg.surveyId);
      const submittedAt = msg.data?.submitted_at || msg.data?.submittedAt || null;
      const newResp = {
        id: msg.data?.id || Date.now(),
        surveyId: msg.surveyId,
        surveyTitle: surveyMatch ? surveyMatch.title : 'Live Survey',
        time: submittedAt || new Date().toISOString(),
        valid: (msg.data?.quality_label || 'good') !== 'spam',
        quality_label: msg.data?.quality_label || 'good',
        respondent_ip: msg.data?.respondent_ip || 'Anonymous',
      };
      setLiveFeed((prev) => dedupeFeed([newResp, ...(prev || [])]).slice(0, 15));
      fetchAnalytics({ background: true });
    }
  }, [fetchAnalytics]);

  const volumeData = useMemo(() => {
    if (!data) return [];
    const now = new Date();
    const recent = Array.isArray(data.recentResponses) ? data.recentResponses : [];
    const toDate = (r) => new Date(r.time || r.submitted_at || r.created_at || 0);
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    if (volumeRange === 'monthly') {
      const activeTrend = data.responseTrend?.month || data.responseTrend || [];
      const trend = Array.isArray(activeTrend) ? activeTrend : [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = now.getMonth();
      const lastSix = Array.from({ length: 6 }).map((_, idx) => {
        const monthIndex = (currentMonth - (5 - idx) + 12) % 12;
        return months[monthIndex];
      });
      return lastSix.map((label) => trend.find((t) => typeof t.date === 'string' && t.date.includes(label)) || { date: label, responses: 0 });
    }

    if (volumeRange === 'weekly') {
      if (Array.isArray(data.responseTrendWeekly) && data.responseTrendWeekly.length > 0) {
        return data.responseTrendWeekly;
      }
      const day = now.getDay();
      const diff = (day + 6) % 7;
      const currentWeekStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff));
      const weeks = Array.from({ length: 8 }).map((_, idx) => {
        const start = new Date(currentWeekStart);
        start.setDate(currentWeekStart.getDate() - (7 * (7 - idx)));
        const end = endOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6));
        const label = `${format(start, 'MMM d')}`;
        const count = recent.filter(r => {
          const d = toDate(r);
          return d >= start && d <= end;
        }).length;
        return { date: label, responses: count };
      });
      return weeks;
    }

    if (Array.isArray(data.responseTrendDaily) && data.responseTrendDaily.length > 0) {
      return data.responseTrendDaily.slice(-7);
    }

    const days = Array.from({ length: 7 }).map((_, idx) => {
      const d = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - idx)));
      const label = format(d, 'MMM d');
      const count = recent.filter(r => {
        const rd = toDate(r);
        return rd >= d && rd <= endOfDay(d);
      }).length;
      return { date: label, responses: count };
    });
    return days;
  }, [data, volumeRange]);

  const volumeMax = useMemo(() => {
    return Math.max(1, ...(volumeData || []).map((d) => Number(d.responses) || 0));
  }, [volumeData]);

  const volumeSummary = useMemo(() => {
    const items = Array.isArray(volumeData) ? volumeData : [];
    const total = items.reduce((sum, d) => sum + (Number(d.responses) || 0), 0);
    let peak = 0;
    let peakDate = '';
    items.forEach((d) => {
      const v = Number(d.responses) || 0;
      if (v >= peak) {
        peak = v;
        peakDate = String(d.date || '');
      }
    });
    return { total, peak, peakDate };
  }, [volumeData]);

  const volumeHasData = useMemo(() => {
    return volumeData.some((item) => Number(item.responses) > 0);
  }, [volumeData]);

  const activeSurveys = useMemo(() => {
    const items = Array.isArray(data?.topSurveys) ? data.topSurveys : [];
    return items.filter((s) => Number(s?.is_active) === 1);
  }, [data]);

  const performanceData = useMemo(() => {
    const items = Array.isArray(data?.topSurveys) ? data.topSurveys : [];
    return items.map((s) => ({
      ...s,
      value: performanceMetric === 'responses' ? s.responses : s.rate,
    }));
  }, [data, performanceMetric]);

  const notifications = useMemo(() => {
    const clearedAt = notifClearedAt ? new Date(notifClearedAt) : null;
    return (liveFeed || [])
      .filter((resp) => {
        if (!clearedAt) return true;
        const t = new Date(resp.time || resp.submitted_at || resp.created_at || 0);
        return t > clearedAt;
      })
      .slice(0, 8)
      .map((resp) => ({
        id: resp.id,
        surveyId: resp.surveyId,
        title: resp.surveyTitle || 'New response',
        time: resp.time,
        quality: resp.quality_label || 'good',
      }));
  }, [liveFeed, notifClearedAt]);

  const liveFeedItems = useMemo(() => {
    const items = Array.isArray(liveFeed) ? liveFeed : [];
    return items.slice(0, 8);
  }, [liveFeed]);

  useEffect(() => {
    if (!notifOpen || !notifButtonRef.current) return;
    const updatePosition = () => {
      const rect = notifButtonRef.current.getBoundingClientRect();
      const dropdownWidth = 340;
      const padding = 16;
      const left = Math.min(rect.left, window.innerWidth - dropdownWidth - padding);
      const top = rect.bottom + 12;
      setNotifPos({ top, left: Math.max(padding, left) });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [notifOpen]);

  const { isConnected: wsConnected } = useWebSocket(onWsMessage);

  if (loading || !data) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-custom-spin" />
        </div>
      </AppShell>
    );
  }

  const kpiData = [
    { label: 'Total responses', value: data.totalResponses.toLocaleString(), icon: Users },
    { label: 'Active surveys', value: String(data.activeSurveys ?? data.totalSurveys ?? 0), icon: FileText },
    { label: 'Avg completion', value: data.avgCompletionRate, icon: CheckCircle2 },
    { label: 'Quality score', value: `${data.qualityDistribution?.find(q => q.name === 'Valid')?.value || 100}%`, icon: Activity },
  ];

  return (
    <AppShell>
      <div className="glass-panel rounded-[var(--radius-xl)] p-6 sm:p-8 mb-5 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="glass">Dashboard</Badge>
              <Badge variant={wsConnected ? 'emerald' : 'amber'} dot>
                {wsConnected ? 'Live' : 'Polling'}
              </Badge>
              {refreshing && <Badge variant="glass">Updating…</Badge>}
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-semibold text-text-1 tracking-tight">Welcome back, {user?.username}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-text-2">
              <span>{currentDate}</span>
              {lastUpdatedAt && (
                <span className="text-xs font-semibold text-text-2/70">
                  • Updated {formatDistanceToNow(new Date(lastUpdatedAt))} ago
                </span>
              )}
            </div>
            {error && <p className="text-xs font-semibold text-danger mt-2">{error}</p>}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => fetchAnalytics({ background: true })}
              className="gap-2 bg-surface-2 hover:bg-white/10 border-white/10"
              disabled={refreshing}
              aria-label="Refresh dashboard"
              size="sm"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-custom-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <div className="relative">
              <Button
                variant="secondary"
                className="!p-3 !rounded-full relative bg-surface-2 hover:bg-white/10 border-white/10"
                onClick={() => setNotifOpen((prev) => !prev)}
                ref={notifButtonRef}
              >
                <Bell size={18} />
                {notifications.length > 0 && <span className="absolute top-2.5 right-2 w-2.5 h-2.5 bg-danger rounded-full shadow-glow" />}
              </Button>
              {notifOpen && createPortal(
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-[60] cursor-default"
                    onClick={() => setNotifOpen(false)}
                    aria-label="Close notifications"
                  />
                  <div
                    className="fixed z-[70] w-[340px] rounded-xl border border-white/10 bg-surface shadow-xl overflow-hidden"
                    style={{ top: notifPos.top, left: notifPos.left }}
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
                      <span className="text-xs font-semibold text-text-2">Notifications</span>
                      <div className="flex items-center gap-3 text-xs text-text-2">
                        <span>{notifications.length} new</span>
                        <button
                          type="button"
                          onClick={() => setNotifClearedAt(new Date().toISOString())}
                          className="text-primary hover:text-primary/80 transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-text-2 text-center">No new notifications</div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              setNotifOpen(false);
                              navigate(`/surveys/${n.surveyId}/results`);
                            }}
                            className="w-full text-left px-4 py-3 border-b border-white/10 hover:bg-white/[0.04] transition-colors"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-text-1 truncate">{n.title}</p>
                              <Badge variant={n.quality === 'good' ? 'emerald' : n.quality === 'suspect' ? 'amber' : 'red'} className="!text-[9px]">
                                {n.quality}
                              </Badge>
                            </div>
                            <p className="text-xs text-text-2 mt-1">{formatDistanceToNow(new Date(n.time))} ago</p>
                          </button>
                        ))
                      )}
                    </div>
                    <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02]">
                      <Button variant="ghost" size="sm" className="w-full !text-xs" onClick={() => {
                        setNotifOpen(false);
                        navigate('/surveys');
                      }}>
                        View all activity
                      </Button>
                    </div>
                  </div>
                </>,
                document.body
              )}
            </div>
            <Button variant="primary" onClick={() => navigate('/surveys/new')} className="gap-2 !rounded-full !px-5">
              <Plus size={16} strokeWidth={3} /> New Survey
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiData.map((kpi, i) => (
          <Card key={i} glass padding="p-5">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 flex-shrink-0 rounded-[var(--radius-lg)] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                <kpi.icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-2 mb-0.5">{kpi.label}</p>
                <p className="text-2xl font-semibold text-text-1 tracking-tight">{kpi.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card glass className="lg:col-span-2 flex flex-col h-full" padding="p-0">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-white/10 shrink-0">
            <div>
              <h3 className="text-base font-semibold text-text-1">Response volume</h3>
              <p className="text-sm text-text-2 mt-0.5">Feedback collected over time</p>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-surface p-1 shrink-0">
              {['daily', 'weekly', 'monthly'].map((range) => (
                <button
                  key={range}
                  onClick={() => setVolumeRange(range)}
                  className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide rounded-full transition-all duration-300 ${volumeRange === range ? 'bg-primary text-white shadow-glow' : 'text-text-2 hover:bg-surface-2 hover:text-text-1'
                    }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="relative flex-1 w-full px-5 pb-3 min-h-[192px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 15 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--color-text-2)' }}
                  dy={6}
                  interval="preserveStartEnd"
                  minTickGap={28}
                  tickMargin={12}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--color-text-2)' }}
                  domain={[0, Math.max(3, volumeMax + 1)]}
                  width={28}
                  tickMargin={8}
                />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--color-text-1)', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="responses"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--color-primary)', fill: 'var(--color-surface)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
            {!volumeHasData && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-text-2">
                  No responses in this range yet
                </div>
              </div>
            )}
          </div>
          <div className="px-6 pb-5 pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-text-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                Total {volumeSummary.total}
              </span>
              <span className="text-text-2/80">
                Peak {volumeSummary.peak}{volumeSummary.peakDate ? ` on ${volumeSummary.peakDate}` : ''}
              </span>
            </div>
            <span className="text-text-2/60 font-semibold">
              {volumeRange === 'daily' ? 'Last 7 days' : volumeRange === 'weekly' ? 'Last 6 weeks' : 'Last 6 months'}
            </span>
          </div>
        </Card>

        <Card glass padding="p-0">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <div>
              <h3 className="text-base font-semibold text-text-1">Survey performance</h3>
              <p className="text-sm text-text-2 mt-0.5">Top surveys</p>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-surface p-1">
              {[
                { id: 'responses', label: 'Responses' },
                { id: 'valid_rate', label: 'Valid' },
              ].map((metric) => (
                <button
                  key={metric.id}
                  onClick={() => setPerformanceMetric(metric.id)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-full transition-all duration-300 ${metric.id === performanceMetric
                      ? 'bg-primary text-white shadow-glow'
                      : 'text-text-2 hover:bg-surface-2 hover:text-text-1'
                    }`}
                >
                  {metric.label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-5">
            {performanceData.length > 0 ? (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                {performanceData.map((entry, index) => {
                  const maxResponses = Math.max(...performanceData.map((p) => p.responses || 1));
                  const value = performanceMetric === 'valid_rate' ? entry.rate : entry.responses;
                  const label = performanceMetric === 'valid_rate' ? `${entry.rate}%` : entry.responses;
                  const width = performanceMetric === 'valid_rate'
                    ? `${Math.min(100, value)}%`
                    : `${Math.min(100, (value / maxResponses) * 100)}%`;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => navigate(`/surveys/${entry.id}/results`)}
                      className="w-full text-left rounded-xl border border-white/10 bg-white/[0.02] p-3 hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-1 truncate">{entry.title}</p>
                          <p className="text-[11px] text-text-2 mt-0.5">
                            {performanceMetric === 'valid_rate' ? `${entry.responses} responses` : `Valid rate ${entry.rate}%`}
                          </p>
                        </div>
                        <div className="text-xs font-semibold text-text-1">{label}</div>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width, backgroundColor: getRateColor(entry.rate) }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-text-2 py-10">
                <AlertTriangle className="mb-2 opacity-50" />
                <p className="text-sm">No survey data yet</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card glass padding="p-0" className="flex flex-col h-full">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-1">Live feed</h3>
            <span className="text-xs text-text-2">
              {liveFeedItems.length}{liveFeed.length > liveFeedItems.length ? ` / ${liveFeed.length}` : ''} recent
            </span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-2 custom-scrollbar">
            {!liveFeed?.length ? (
              <div className="h-full flex flex-col items-center justify-center text-text-2 gap-2 py-10">
                <Activity size={20} className="opacity-50" />
                <p className="text-sm">{wsConnected ? 'Listening for responses…' : 'Polling for responses…'}</p>
                <button
                  type="button"
                  onClick={() => fetchAnalytics({ background: true })}
                  className="mt-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Force refresh
                </button>
              </div>
            ) : (
              <>
                {liveFeedItems.map((resp) => (
                  <button
                    key={resp.id}
                    type="button"
                    onClick={() => navigate(`/surveys/${resp.surveyId}/results`)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-1 truncate">{resp.surveyTitle}</p>
                      <p className="mt-1 text-xs text-text-2 truncate">
                        Anonymous • {formatDistanceToNow(new Date(resp.time))} ago
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {resp.quality_label === 'good' && <Badge variant="emerald" className="!text-[10px] !px-2">Valid</Badge>}
                      {resp.quality_label === 'suspect' && <Badge variant="amber" className="!text-[10px] !px-2">Suspect</Badge>}
                      {resp.quality_label === 'spam' && <Badge variant="red" className="!text-[10px] !px-2">Spam</Badge>}
                      <ChevronRight size={14} className="text-text-2" />
                    </div>
                  </button>
                ))}
                {liveFeed.length < 8 && (
                  <div className="pt-3 text-center text-xs font-semibold text-text-2/70">
                    {wsConnected ? 'Listening for more responses…' : 'Polling for more responses…'}
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        <Card glass padding="p-0" className="flex flex-col h-full">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-1">Active surveys</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/surveys')} className="!text-xs">View all</Button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {activeSurveys.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-2 gap-2 py-10">
                <FileText size={20} className="opacity-50" />
                <p className="text-sm">Create a survey to see data.</p>
                <Button variant="primary" size="sm" onClick={() => navigate('/surveys/new')} className="mt-2">Create survey</Button>
              </div>
            ) : activeSurveys.map((s, i) => (
              <button 
                key={i} 
                className="w-full text-left flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.015] hover:bg-white/[0.04] hover:border-white/10 transition-all group"
                onClick={() => navigate(`/surveys/${s.id}/results`)}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="font-semibold text-sm text-text-1 truncate">{s.title}</h4>
                  <div className="flex items-center gap-3 mt-2 min-w-0">
                    <p className="text-[11px] text-text-2 whitespace-nowrap">{s.responses?.toLocaleString() || 0} responses</p>
                    <div className="flex-1 max-w-[100px] bg-white/[0.08] rounded-full h-[3px] overflow-hidden shrink-0">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.rate}%`, backgroundColor: getRateColor(s.rate) }} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: getRateColor(s.rate) }}>{s.rate}% Valid</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:border-primary group-hover:text-white text-text-2 transition-all">
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
