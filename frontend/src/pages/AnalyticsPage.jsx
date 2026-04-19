import { usePageTitle } from '../hooks/usePageTitle';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid
} from 'recharts';
import { 
  Users, FileText, TrendingUp, Clock, Activity,
  ArrowUpRight, ArrowDownRight, Minus, Download, Sparkles
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { getGlobalAnalytics, exportData } from '../api/analyticsApi';

const TOOLTIP_STYLE = {
  backgroundColor: '#111827',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#F9FAFB',
  fontSize: 12,
};

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('12M');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const activeChartMode = useMemo(() => {
    if (timeRange === '7D' || timeRange === '30D') return 'day';
    if (timeRange === '3M' || timeRange === '12M' || timeRange === 'YTD') return 'month';
    return 'year';
  }, [timeRange]);

  const paddedTrendData = useMemo(() => {
    if (!data?.responseTrend) return [];
    const sourceData = data.responseTrend[activeChartMode] || [];
    
    const valMap = {};
    sourceData.forEach(d => { valMap[d.date] = d.responses; });

    const now = new Date();
    const result = [];

    if (activeChartMode === 'month') {
      let count = 12;
      if (timeRange === '3M') count = 3;
      if (timeRange === 'YTD') count = now.getMonth() + 1;

      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString('en-US', { month: 'short' });
        result.push({ date: label, responses: valMap[label] || 0 });
      }
      return result;
    }
    
    if (activeChartMode === 'day') {
      const count = timeRange === '7D' ? 7 : 30;
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        result.push({ date: label, responses: valMap[label] || 0 });
      }
      return result;
    }

    return sourceData;
  }, [data, activeChartMode, timeRange]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportData('csv', timeRange);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  }, [timeRange]);

  const fetchGlobalStats = useCallback(async () => {
    try {
      const res = await getGlobalAnalytics(timeRange);
      setData(res);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      if (loading) setLoading(false);
    }
  }, [timeRange, loading]);

  useEffect(() => {
    fetchGlobalStats();
    const interval = setInterval(fetchGlobalStats, 7000);
    return () => clearInterval(interval);
  }, [fetchGlobalStats]);

  if (loading || !data) {
    return (
      <AppShell>
         <div className="flex items-center justify-center h-[50vh]">
            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-custom-spin" />
         </div>
      </AppShell>
    );
  }

  const kpis = [
    { label: 'Total responses', value: data.totalResponses.toLocaleString(), change: data.responsesChange, trend: data.responsesTrend, icon: Users },
    { label: 'Active surveys', value: String(data.activeSurveys ?? data.totalSurveys ?? 0), change: data.activeSurveysChange, trend: data.activeSurveysTrend, icon: FileText },
    { label: 'Avg completion rate', value: data.avgCompletionRate, change: data.completionChange, trend: data.completionTrend, icon: TrendingUp },
    { label: 'Avg time', value: data.avgTime, change: data.timeChange, trend: data.timeTrend, icon: Clock },
  ];

  return (
    <AppShell>
      <div className="glass-panel rounded-[var(--radius-xl)] p-6 sm:p-8 mb-5 shadow-sm">
        <div className="max-w-[1320px] mx-auto flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <Badge variant="glass">Analytics</Badge>
              <Badge variant="glass" dot>Overview</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-semibold text-text-1 tracking-tight">Global Analytics</h1>
            <p className="text-sm font-medium text-text-2 mt-1.5 max-w-xl">Cross-survey performance and response quality trends.</p>
          </div>
          <div className="flex flex-wrap items-stretch gap-3">
            <div className="flex bg-surface-2 rounded-xl border border-white/5 p-1 w-full sm:w-auto">
              {['7D', '30D', '3M', '12M', 'YTD'].map((t) => (
                <button key={t} onClick={() => setTimeRange(t)} className={`px-4 py-2 text-[11px] font-bold tracking-wide uppercase rounded-lg transition-all duration-300 whitespace-nowrap ${timeRange === t ? 'bg-primary text-white shadow-glow' : 'text-text-2 hover:text-text-1 hover:bg-white/5'}`}>
                  {t}
                </button>
              ))}
            </div>
            <Button variant="ghost" className="gap-2 bg-surface-2 text-text-1 border border-white/5 rounded-xl px-5 hover:bg-white/10 hover:border-white/20 transition-all text-[11px] font-bold tracking-wide uppercase h-full" onClick={handleExport} disabled={exporting}>
              <Download size={14} className="opacity-80" /> 
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 pb-12">
        {/* ── ROW 1: KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map((kpi, i) => (
          <Card key={i} glass padding="p-6" className="h-full">
            <div className="flex justify-between items-start mb-5">
              <div className="h-10 w-10 rounded-[var(--radius-lg)] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                <kpi.icon size={20} />
              </div>
              <div className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md bg-surface ${
                kpi.trend === 'up' ? 'text-success border border-success/20' :
                kpi.trend === 'down' ? 'text-danger border border-danger/20' :
                'text-text-2 border border-white/10'
              }`}>
                {kpi.trend === 'up' ? <ArrowUpRight size={14} /> : kpi.trend === 'down' ? <ArrowDownRight size={14} /> : <Minus size={14} />}
                {kpi.change !== '—' && <span>{kpi.change}</span>}
              </div>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-2 mb-1">{kpi.label}</p>
            <p className="text-3xl font-semibold text-text-1 tracking-tight">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* ── ROW 2: MAIN CHART + PIE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Volume Area Chart */}
        <Card glass className="lg:col-span-2 p-6 flex flex-col">
          <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-lg font-semibold text-text-1 tracking-tight">Response Volume Trend</h3>
              <p className="text-sm font-medium text-text-2 mt-1">Aggregated dynamically across all active surveys</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 whitespace-nowrap">
                <Sparkles size={12} />
                Updated live
              </div>
            </div>
          </div>
          <div className="flex-1 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={paddedTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 15 }}>
                <defs>
                  <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-text-2)' }} dy={8} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-text-2)' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="responses" stroke="var(--color-primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#analyticsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quality Pie Chart */}
        <Card glass className="p-6 flex flex-col">
          <div className="border-b border-white/5 pb-4 mb-6">
            <h3 className="text-lg font-semibold text-text-1 tracking-tight">Response Quality</h3>
            <p className="text-sm font-medium text-text-2 mt-1">AI-powered classification</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            {data.totalResponses > 0 && data.qualityDistribution?.length > 0 ? (
                <>
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.qualityDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                          {data.qualityDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} stroke="rgba(255,255,255,0.02)" strokeWidth={1} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => `${v}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 w-full mt-2">
                    {data.qualityDistribution.map((q, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: q.fill }} />
                          <span className="text-text-1 font-medium">{q.name}</span>
                        </div>
                        <span className="font-bold text-text-1">{q.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-text-2">
                    <Activity className="opacity-50 mb-2" size={32} />
                    <p className="text-sm">Not enough data to parse</p>
                </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── ROW 3: TABLE + COMPLETION BAR CHART ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        
        {/* Top Surveys Table */}
        <Card glass padding="p-0" className="xl:col-span-3 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02]">
            <h3 className="text-lg font-semibold text-text-1 tracking-tight">Top Performing Surveys</h3>
            <Button variant="ghost" className="!px-4 !py-2 !text-xs !font-medium !rounded-xl !bg-[var(--color-surface)] !border !border-[var(--color-border)] hover:!bg-[var(--color-surface-2)] text-text-2 hover:text-text-1 transition-all" onClick={() => navigate('/surveys')}>
              See All
            </Button>
          </div>
          <div className="flex-1">
            {/* Header */}
            <div className="flex px-6 py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-text-2/80 border-b border-white/5 bg-surface/50">
              <div className="flex-1">Survey Name</div>
              <div className="w-28 text-right">Responses</div>
              <div className="w-24 text-right">Completion</div>
              <div className="w-16 text-right">Trend</div>
            </div>
            {data.topSurveys.map((s, i) => (
              <div key={i} onClick={() => navigate(`/surveys/${s.id}/results`)} className="flex items-center px-6 py-4 border-b border-white/5 hover:bg-white/[0.05] transition-colors text-sm cursor-pointer group">
                <div className="flex-1 font-medium text-text-1 truncate pr-4 group-hover:text-primary transition-colors">{s.title}</div>
                <div className="w-28 text-right font-semibold text-text-1">{s.responses.toLocaleString()}</div>
                <div className="w-24 text-right">
                  <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${s.rate >= 80 ? 'bg-success/10 text-success' : s.rate >= 60 ? 'bg-accent/10 text-accent' : 'bg-danger/10 text-danger'}`}>
                    {s.rate}%
                  </span>
                </div>
                <div className="w-16 flex justify-end">
                  {s.trend === 'up' ? (
                    <ArrowUpRight size={18} className="text-success" />
                  ) : s.trend === 'down' ? (
                     <ArrowDownRight size={18} className="text-danger" />
                  ) : (
                    <Minus size={18} className="text-text-2" />
                  )}
                </div>
              </div>
            ))}
            {data.topSurveys.length === 0 && (
                <div className="p-10 text-center flex flex-col items-center justify-center text-text-2 text-sm">
                    <FileText size={32} className="opacity-20 mb-3" />
                    <p className="max-w-sm">No response data available. Once responses are submitted, this leaderboard will populate automatically.</p>
                </div>
            )}
          </div>
        </Card>

        {/* Completion by Day of Week */}
        <Card glass className="xl:col-span-2 p-6 flex flex-col">
          <div className="border-b border-white/5 pb-4 mb-5">
            <h3 className="text-base font-semibold text-text-1 tracking-tight">Completion by Weekday</h3>
            <p className="text-sm font-medium text-text-2 mt-1">When are respondents most engaged?</p>
          </div>
          <div className="flex-1 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.completionByDay} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'var(--color-text-2)', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'var(--color-text-2)' }}
                  unit="%"
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 6 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const { day, rate } = payload[0].payload;
                    const tier = rate >= 75 ? { label: 'HIGH', color: '#6366F1', bg: 'rgba(99,102,241,0.15)' }
                      : rate >= 60 ? { label: 'MID', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' }
                      : { label: 'LOW', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)' };
                    return (
                      <div style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', minWidth: 140 }}>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{day}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                          <span style={{ color: '#fff', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{rate}%</span>
                          <span style={{ background: tier.bg, color: tier.color, fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{tier.label}</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 4, height: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${rate}%`, height: '100%', background: tier.color, borderRadius: 4, transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="rate" radius={[5, 5, 0, 0]} maxBarSize={36}>
                  {data.completionByDay.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.rate >= 75 ? '#6366F1' : entry.rate >= 60 ? '#F59E0B' : 'rgba(255,255,255,0.08)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-5 mt-5 pt-4 border-t border-white/5">
            {[
              { color: '#6366F1', label: 'HIGH', sub: '≥75%' },
              { color: '#F59E0B', label: 'MID', sub: '≥60%' },
              { color: 'rgba(255,255,255,0.2)', label: 'LOW', sub: '<60%' },
            ].map(({ color, label, sub }) => (
              <div key={label} className="flex items-center gap-2">
                <div style={{ background: color }} className="w-2.5 h-2.5 rounded-full flex-shrink-0" />
                <span className="text-[10px] font-bold text-text-2 uppercase tracking-widest">{label}</span>
                <span className="text-[10px] text-text-2/50 font-medium">{sub}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      </div>
    </AppShell>
  );
}
