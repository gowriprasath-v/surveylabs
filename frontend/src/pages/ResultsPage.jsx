import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { List } from 'react-window';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Minus,
  Quote,
  Share2,
  ShieldAlert,
  Sparkles,
  Star,
  Tag,
  Target,
  Timer,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { getResults, getIndividualResponses } from '../api/surveyApi';
import { useToast } from '../context/ToastContext';
import { generateInsights } from '../utils/insightEngine';
import AppShell from '../components/layout/AppShell';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const tabs = [
  { id: 'summary', icon: BarChart2, label: 'Summary' },
  { id: 'responses', icon: MessageSquare, label: 'Responses' },
  { id: 'insights', icon: Lightbulb, label: 'Insights' },
  { id: 'quality', icon: ShieldAlert, label: 'Quality' },
  { id: 'distribution', icon: Share2, label: 'Share' },
];

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

const formatDateTime = (value) =>
  new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function ResultsPage() {
  const { id } = useParams();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedResponseId, setSelectedResponseId] = useState(null);

  useEffect(() => {
    let timer;
    const fetchData = async (isPoll = false) => {
      try {
        if (!isPoll) setLoading(true);
        const [results, indiv] = await Promise.all([
          getResults(id),
          getIndividualResponses(id),
        ]);

        const safeResponses = Array.isArray(indiv?.responses) ? indiv.responses : [];
        const safeQuestions = Array.isArray(results?.questions) ? results.questions : [];

        let avgTimeMs = 0;
        let validTimes = 0;
        safeResponses.forEach((response) => {
          if (response.completion_time_ms) {
            avgTimeMs += response.completion_time_ms;
            validTimes++;
          }
        });

        const avgSec = validTimes > 0 ? Math.round(avgTimeMs / validTimes / 1000) : 0;
        const avgTimeFormatted = avgSec > 60 ? `${Math.floor(avgSec / 60)}m ${avgSec % 60}s` : `${avgSec}s`;

        const safeSurvey = {
          id: results?.survey?.id || id,
          title: results?.survey?.title || 'Untitled Survey',
          description: results?.survey?.description || '',
          is_active: results?.survey?.is_active ?? 0,
          questions: safeQuestions,
        };

        setData({
          survey: safeSurvey,
          rawResponses: safeResponses,
          responses: safeResponses.map((response, index) => {
            const label = `Response ${index + 1}`;
            return {
            id: response.id,
            text: label,
            time: response.completion_time_ms ? `${Math.round(response.completion_time_ms / 1000)}s` : 'N/A',
            date: response.submitted_at,
            quality_label: response.quality_label || 'good',
            respondent_ip: response.respondent_ip || 'Anonymous',
            answers: response.answers || [],
            };
          }),
          stats: {
            responses: results?.stats?.total_responses || safeResponses.length || 0,
            completionRate: 100,
            avgTime: avgTimeFormatted,
          },
        });
      } catch (err) {
        if (!isPoll) toast.error('Failed to load survey results');
      } finally {
        if (!isPoll) setLoading(false);
      }
    };

    fetchData();
    timer = setInterval(() => fetchData(true), 5000); // 5 sec live polling
    return () => clearInterval(timer);
  }, [id, toast]);

  useEffect(() => {
    if (!data?.responses || data.responses.length === 0) return;
    if (!selectedResponseId) {
      setSelectedResponseId(data.responses[0].id || '0');
    }
  }, [data, selectedResponseId]);

  const realInsights = useMemo(() => {
    if (!data || !Array.isArray(data.survey?.questions)) return [];
    try {
      return generateInsights(data.survey, Array.isArray(data.rawResponses) ? data.rawResponses : []);
    } catch {
      return [];
    }
  }, [data]);

  const qualityBreakdown = useMemo(() => {
    if (!data) return { good: 0, suspect: 0, spam: 0, qualityScore: 100 };
    const counts = { good: 0, suspect: 0, spam: 0 };
    (Array.isArray(data.rawResponses) ? data.rawResponses : []).forEach((response) => {
      const label = response.quality_label || 'good';
      if (label === 'spam') counts.spam += 1;
      else if (label === 'suspect') counts.suspect += 1;
      else counts.good += 1;
    });
    const total = (Array.isArray(data.rawResponses) ? data.rawResponses.length : 0) || 1;
    const qualityScore = Math.max(0, Math.round(((counts.good + counts.suspect * 0.5) / total) * 100));
    return { ...counts, qualityScore };
  }, [data]);

  const flaggedResponses = useMemo(() => {
    if (!data) return [];
    return (Array.isArray(data.rawResponses) ? data.rawResponses : [])
      .filter((response) => response.quality_label === 'suspect' || response.quality_label === 'spam')
      .map((response) => ({
        id: response.id.substring(0, 8),
        respondent: response.respondent_ip ? `User ${response.respondent_ip.slice(-4)}` : `Anon ${response.id.substring(0, 4)}`,
        flag: response.quality_label === 'spam' ? 'Spam / Gibberish' : 'Suspicious pattern',
        desc: `Marked as ${response.quality_label} and completed in ${response.completion_time_ms ? Math.round(response.completion_time_ms / 1000) : 0}s.`,
        status: response.quality_label === 'spam' ? 'quarantined' : 'flagged',
      }));
  }, [data]);

  const questionSnapshots = useMemo(() => {
    if (!data) return [];
    const questions = Array.isArray(data.survey?.questions) ? data.survey.questions : [];
    const responses = Array.isArray(data.rawResponses) ? data.rawResponses : [];

    return questions.slice(0, 4).map((question) => {
      const answers = responses
        .map((response) => response.answers?.find((answer) => answer.question_id === question.id)?.answer_value)
        .filter(Boolean);

      if (question.type === 'rating') {
        const numbers = answers.map((value) => Number(value)).filter((value) => !Number.isNaN(value));
        const average = numbers.length ? (numbers.reduce((sum, value) => sum + value, 0) / numbers.length).toFixed(1) : '0.0';
        return {
          id: question.id,
          title: question.text || `Question ${question.id}`,
          type: 'Rating',
          metric: `${average}/5`,
          detail: `${numbers.length} rating${numbers.length === 1 ? '' : 's'} recorded`,
        };
      }

      if (question.type === 'mcq') {
        const grouped = answers.reduce((acc, answer) => {
          acc[answer] = (acc[answer] || 0) + 1;
          return acc;
        }, {});
        const sorted = Object.entries(grouped || {}).sort((a, b) => b[1] - a[1]);
        const topEntry = sorted[0];
        const totalAnswered = answers.length;
        const topPct = topEntry && totalAnswered > 0 ? Math.round((topEntry[1] / totalAnswered) * 100) : 0;
        return {
          id: question.id,
          title: question.text || `Question ${question.id}`,
          type: 'Multiple Choice',
          metric: topEntry ? topEntry[0] : 'No signal yet',
          detail: topEntry ? `${topEntry[1]} response${topEntry[1] === 1 ? '' : 's'} selected this` : 'No answers yet',
          topPct,
          totalAnswered,
        };
      }

      return {
        id: question.id,
        title: question.text || `Question ${question.id}`,
        type: 'Text',
        metric: `${answers.length}`,
        detail: `Open-ended response${answers.length === 1 ? '' : 's'} captured`,
        topPct: undefined,
      };
    });
  }, [data]);

  const surveyLink = useMemo(() => `${window.location.origin}/s/${id}`, [id]);

  const summaryStats = useMemo(() => {
    if (!data) return [];
    const questionCount = Array.isArray(data.survey?.questions) ? data.survey.questions.length : 0;
    return [
      {
        label: 'Participants',
        value: data.stats.responses.toLocaleString(),
        subtext: `${questionCount} questions tracked`,
        icon: Users,
        tone: 'from-primary/20 to-primary/5 text-primary',
      },
      {
        label: 'Avg completion',
        value: data.stats.avgTime,
        subtext: `${data.stats.completionRate}% completion rate`,
        icon: Clock3,
        tone: 'from-success/20 to-success/5 text-success',
      },
      {
        label: 'Quality score',
        value: `${qualityBreakdown.qualityScore}%`,
        subtext: `${qualityBreakdown.good} clean, ${qualityBreakdown.suspect} suspect`,
        icon: CheckCircle2,
        tone: 'from-accent/20 to-accent/5 text-accent',
      },
    ];
  }, [data, qualityBreakdown]);

  const responseRate = useMemo(() => {
    if (!data) return '0 today';
    const now = Date.now();
    const last24 = (Array.isArray(data.rawResponses) ? data.rawResponses : [])
      .filter((r) => {
        const t = new Date(r.submitted_at || r.created_at || 0).getTime();
        return !Number.isNaN(t) && now - t <= 24 * 60 * 60 * 1000;
      }).length;
    return `${last24} in 24h`;
  }, [data]);

  const responses = Array.isArray(data?.responses) ? data.responses : [];
  const surveyQuestions = Array.isArray(data?.survey?.questions) ? data.survey.questions : [];
  const questionCount = surveyQuestions.length;

  useEffect(() => {
    if (!copied) return undefined;
    const timeout = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(surveyLink);
      setCopied(true);
      toast.success('Survey link copied');
    } catch (err) {
      toast.error('Unable to copy link');
    }
  };

  const handleExportCSV = () => {
    if (!data) return;
    const questions = Array.isArray(data.survey?.questions) ? data.survey.questions : [];
    const qHeaders = questions.map((q) => `"${(q.text || '').replace(/"/g, '""')}"`);
    const header = ['Response #', 'Submitted At', 'Duration', 'Quality', ...qHeaders].join(',');
    const rows = (Array.isArray(data.rawResponses) ? data.rawResponses : []).map((r, idx) => {
      const answers = Array.isArray(r.answers) ? r.answers : [];
      const qValues = questions.map((q) => {
        const a = answers.find((an) => an.question_id === q.id);
        return `"${(a?.answer_value || '').replace(/"/g, '""')}"`;
      });
      const dur = r.completion_time_ms ? `${Math.round(r.completion_time_ms / 1000)}s` : 'N/A';
      return [idx + 1, r.submitted_at || '', dur, r.quality_label || 'good', ...qValues].join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.survey?.title || 'survey'}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: data?.survey?.title || 'Survey', url: surveyLink });
        return;
      } catch {}
    }
    await handleCopyLink();
  };

  const handleDownloadQR = () => {
    const svg = document.querySelector('#qr-code-svg');
    if (!svg) { toast.error('QR not found'); return; }
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 256, 256);
      ctx.drawImage(img, 0, 0, 256, 256);
      const a = document.createElement('a');
      a.download = `${data?.survey?.title || 'survey'}_qr.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      toast.success('QR downloaded');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const Row = ({ index, style }) => {
    const response = responses[index];
    if (!response) return <div style={style} />;
    return (
      <div
        style={style}
        className="grid grid-cols-[72px_minmax(0,1fr)_120px_160px] items-center gap-4 px-5 border-b border-white/5 text-sm text-text-1 hover:bg-white/[0.03]"
      >
        <div className="text-text-2 font-mono">#{index + 1}</div>
        <div className="truncate pr-2">{response.text}</div>
        <div className="text-text-2">{response.time}</div>
        <div className="text-right text-text-2">{formatDate(response.date)}</div>
      </div>
    );
  };

  if (loading || !data) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card glass className="w-full max-w-lg" padding="p-10">
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/15 text-primary">
                <Activity className="animate-custom-spin" />
              </div>
              <h2 className="font-display text-2xl text-text-1">Compiling your survey story</h2>
              <p className="mt-2 text-sm text-text-2">We’re loading responses, surfacing patterns, and preparing the dashboard.</p>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* ── HEADER BLOCK ── */}
      <div className="glass-panel rounded-[var(--radius-xl)] p-6 sm:p-8 mb-5 shadow-sm">
        {/* Title row */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between mb-7">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="glass">Survey results</Badge>
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-success bg-success/10 border border-success/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Live analytics
              </span>
            </div>
            <h1 className="text-3xl font-display font-semibold tracking-tight text-text-1 sm:text-4xl mb-2">
              {data.survey?.title || 'Untitled Survey'}
            </h1>
            <p className="text-sm text-text-2 max-w-xl leading-relaxed">
              Real-time performance view — response quality, participation trends, and key insights.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-text-2 hover:text-text-1 bg-surface-2 border border-white/5 hover:border-white/15 px-4 py-2.5 rounded-xl transition-all"
            >
              <Copy size={13} />
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-text-2 hover:text-text-1 bg-surface-2 border border-white/5 hover:border-white/15 px-4 py-2.5 rounded-xl transition-all"
            >
              <Download size={13} />
              Export CSV
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-white bg-primary hover:bg-primary/90 px-5 py-2.5 rounded-xl shadow-glow transition-all"
            >
              <Share2 size={13} />
              Share
            </button>
          </div>
        </div>

        {/* KPI cards + Live pulse */}
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1.4fr]">
          {/* Participants */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 flex flex-col gap-4 hover:bg-white/[0.05] transition-colors">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center text-primary">
                <Users size={17} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-2">Participants</span>
            </div>
            <div>
              <div className="text-3xl font-bold text-text-1 tracking-tight">{data.stats.responses.toLocaleString()}</div>
              <p className="text-xs text-text-2 mt-1">{questionCount} question{questionCount !== 1 ? 's' : ''} tracked</p>
            </div>
          </div>

          {/* Avg Completion */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 flex flex-col gap-4 hover:bg-white/[0.05] transition-colors">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-success/15 border border-success/20 flex items-center justify-center text-success">
                <Clock3 size={17} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-2">Avg Time</span>
            </div>
            <div>
              <div className="text-3xl font-bold text-text-1 tracking-tight">{data.stats.avgTime}</div>
              <p className="text-xs text-text-2 mt-1">{data.stats.completionRate}% completion rate</p>
            </div>
          </div>

          {/* Quality Score */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 flex flex-col gap-4 hover:bg-white/[0.05] transition-colors">
            <div className="flex items-center justify-between">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                qualityBreakdown.qualityScore >= 80 ? 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-400'
                : qualityBreakdown.qualityScore >= 60 ? 'bg-amber-500/15 border border-amber-500/20 text-amber-400'
                : 'bg-red-500/15 border border-red-500/20 text-red-400'
              }`}>
                <CheckCircle2 size={17} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-2">Quality</span>
            </div>
            <div>
              <div className={`text-3xl font-bold tracking-tight ${
                qualityBreakdown.qualityScore >= 80 ? 'text-emerald-400'
                : qualityBreakdown.qualityScore >= 60 ? 'text-amber-400' : 'text-red-400'
              }`}>{qualityBreakdown.qualityScore}%</div>
              <p className="text-xs text-text-2 mt-1">{qualityBreakdown.good} clean, {qualityBreakdown.suspect} suspect</p>
            </div>
          </div>

          {/* Live Pulse */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 flex flex-col gap-4 hover:bg-white/[0.05] transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center text-primary">
                  <Activity size={17} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-2">Live Pulse</p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-bold text-text-1">{data.stats.responses}</span>
                    <span className="text-xs text-text-2">tracked</span>
                  </div>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-success bg-success/10 border border-success/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                {responseRate}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-success/10 border border-success/15 p-3 text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-success/70">Good</p>
                <p className="text-xl font-bold text-success mt-1">{qualityBreakdown.good}</p>
              </div>
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/15 p-3 text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400/70">Suspect</p>
                <p className="text-xl font-bold text-amber-400 mt-1">{qualityBreakdown.suspect}</p>
              </div>
              <div className="rounded-xl bg-red-500/10 border border-red-500/15 p-3 text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-red-400/70">Spam</p>
                <p className="text-xl font-bold text-red-400 mt-1">{qualityBreakdown.spam}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB BAR + META STRIP ── */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between mb-1">
        <div className="flex overflow-x-auto rounded-xl border border-[var(--color-border)] bg-surface-2 p-1.5 custom-scrollbar gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-glow'
                  : 'text-text-2 hover:bg-surface-3 hover:text-text-1'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-surface-2 px-3.5 py-2.5">
            <CalendarDays size={13} className="text-text-2" />
            <span className="text-[11px] text-text-2 font-medium">Started</span>
            <span className="text-[11px] font-semibold text-text-1 ml-1">{responses[0] ? formatDateTime(responses[0].date) : '—'}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-surface-2 px-3.5 py-2.5">
            <Activity size={13} className="text-success" />
            <span className="text-[11px] text-text-2 font-medium">Latest</span>
            <span className="text-[11px] font-semibold text-text-1 ml-1">{responses[responses.length - 1] ? formatDateTime(responses[responses.length - 1].date) : '—'}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-surface-2 px-3.5 py-2.5">
            <HelpCircle size={13} className="text-primary" />
            <span className="text-[11px] font-semibold text-text-1">{questionCount} {questionCount === 1 ? 'question' : 'questions'}</span>
          </div>
        </div>
      </div>

      <div className="min-h-[520px]">
        <>
          {activeTab === 'summary' && (
            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">

              {/* QUESTION SNAPSHOTS */}
              <Card padding="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-semibold text-text-1">Question Snapshots</h2>
                    <p className="text-xs text-text-2 mt-0.5">Strongest signals from each question</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-2 bg-surface-2 border border-white/5 px-2.5 py-1 rounded-full">
                    {questionCount} total
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {questionSnapshots.length === 0 ? (
                    <div className="col-span-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-sm text-text-2 text-center">
                      No questions found in this survey.
                    </div>
                  ) : (
                    questionSnapshots.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 hover:bg-white/[0.05] transition-colors flex flex-col gap-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 ${
                              item.type === 'Rating'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : item.type === 'Multiple Choice'
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            }`}>
                              {item.type === 'Rating' ? <Star size={8} /> : item.type === 'Multiple Choice' ? <Target size={8} /> : <MessageSquare size={8} />}
                              {item.type}
                            </span>
                            <p className="text-sm font-medium text-text-1 leading-snug truncate" title={item.title}>{item.title}</p>
                          </div>
                        </div>

                        {/* Metric */}
                        {item.type === 'Rating' ? (
                          <div>
                            <div className={`text-3xl font-bold tracking-tight ${
                              parseFloat(item.metric) >= 4 ? 'text-emerald-400'
                              : parseFloat(item.metric) >= 2.5 ? 'text-amber-400' : 'text-red-400'
                            }`}>{item.metric}</div>
                            <div className="flex gap-0.5 mt-2">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} size={13}
                                  className={parseFloat(item.metric) >= s ? 'text-amber-400 fill-amber-400' : 'text-white/10'}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-text-2 mt-2">{item.detail}</p>
                          </div>
                        ) : item.type === 'Multiple Choice' ? (
                          <div>
                            <div className="text-2xl font-bold text-text-1 tracking-tight">{item.metric}</div>
                            <p className="text-xs text-text-2 mt-1 mb-3">{item.detail}</p>
                            {/* mini bar showing top option */}
                            {item.topPct !== undefined && (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] text-text-2">
                                  <span className="truncate max-w-[120px]">{item.metric}</span>
                                  <span className="font-bold text-text-1">{item.topPct}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${item.topPct}%` }} />
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="text-2xl font-bold text-text-1 tracking-tight">{item.metric}</div>
                            <p className="text-xs text-text-2 mt-1">{item.detail}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* AUTO-INSIGHTS + QUALITY */}
              <div className="space-y-5">

                {/* Auto-insights */}
                <Card padding="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-semibold text-text-1">Auto-insights</h2>
                      <p className="text-xs text-text-2 mt-0.5">Real-time patterns from your response set</p>
                    </div>
                    <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                      <Sparkles size={16} />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {realInsights.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
                        <Sparkles size={20} className="text-text-2 mx-auto mb-2" />
                        <p className="text-sm text-text-2">Gather responses to unlock insights</p>
                      </div>
                    ) : (
                      realInsights.slice(0, 6).map((insight, index) => {
                        const Icon = {
                          confidence: Zap,
                          engagement: TrendingUp,
                          speed: Timer,
                          dropout: AlertTriangle,
                          consensus: Target,
                          rating: Star,
                          keywords: Tag,
                          sentiment: MessageSquare,
                          evidence: Quote,
                        }[insight.type] || Lightbulb;

                        const iconBg = {
                          emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                          amber:   'bg-amber-500/10  border-amber-500/20  text-amber-400',
                          red:     'bg-red-500/10    border-red-500/20    text-red-400',
                          indigo:  'bg-primary/10   border-primary/20   text-primary',
                        }[insight.color] || 'bg-white/5 border-white/10 text-text-2';

                        const badgeColor = {
                          emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                          amber:   'bg-amber-500/10  text-amber-400  border-amber-500/20',
                          red:     'bg-red-500/10    text-red-400    border-red-500/20',
                          indigo:  'bg-primary/10   text-primary   border-primary/20',
                        }[insight.color] || 'bg-white/5 text-text-2 border-white/10';

                        return (
                          <div key={`${insight.text}-${index}`} className="rounded-xl border border-white/5 bg-white/[0.03] p-3.5 flex gap-3 hover:bg-white/[0.05] transition-colors">
                            <div className={`flex-shrink-0 h-8 w-8 rounded-lg border flex items-center justify-center ${iconBg}`}>
                              <Icon size={14} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${badgeColor}`}>
                                  {insight.type}
                                </span>
                                <span className="text-[10px] text-text-2 truncate max-w-[140px]" title={insight.question}>
                                  {insight.question}
                                </span>
                              </div>
                              <p className="text-xs text-text-1 leading-relaxed">{insight.text}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>

                {/* Quality posture */}
                <Card padding="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-text-1">Quality Posture</h2>
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${
                      qualityBreakdown.qualityScore >= 90 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : qualityBreakdown.qualityScore >= 70 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {qualityBreakdown.qualityScore >= 90 ? 'Clean' : qualityBreakdown.qualityScore >= 70 ? 'Moderate' : 'Risky'}
                    </span>
                  </div>
                  {/* Confidence bar */}
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-text-2">Dataset confidence</p>
                      <span className={`text-xl font-bold ${
                        qualityBreakdown.qualityScore >= 90 ? 'text-emerald-400'
                        : qualityBreakdown.qualityScore >= 70 ? 'text-amber-400' : 'text-red-400'
                      }`}>{qualityBreakdown.qualityScore}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all ${
                          qualityBreakdown.qualityScore >= 90 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                          : qualityBreakdown.qualityScore >= 70 ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                          : 'bg-gradient-to-r from-red-500 to-red-400'
                        }`}
                        style={{ width: `${qualityBreakdown.qualityScore}%` }}
                      />
                    </div>
                  </div>
                  {/* Verdict */}
                  <p className="text-xs text-text-2 leading-relaxed">
                    {qualityBreakdown.spam === 0 && qualityBreakdown.suspect === 0
                      ? '✓ All responses look clean — no spam or suspect patterns detected.'
                      : `${qualityBreakdown.spam > 0 ? `${qualityBreakdown.spam} spam` : ''}${qualityBreakdown.spam > 0 && qualityBreakdown.suspect > 0 ? ' · ' : ''}${qualityBreakdown.suspect > 0 ? `${qualityBreakdown.suspect} suspect` : ''} responses flagged — review in the Quality tab.`
                    }
                  </p>
                  {/* Tier grid */}
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/15 p-2.5 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/60">Good</p>
                      <p className="text-base font-bold text-emerald-400 mt-0.5">{qualityBreakdown.good}</p>
                    </div>
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/15 p-2.5 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400/60">Suspect</p>
                      <p className="text-base font-bold text-amber-400 mt-0.5">{qualityBreakdown.suspect}</p>
                    </div>
                    <div className="rounded-lg bg-red-500/10 border border-red-500/15 p-2.5 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-red-400/60">Spam</p>
                      <p className="text-base font-bold text-red-400 mt-0.5">{qualityBreakdown.spam}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'responses' && (() => {
            const questions = Array.isArray(data.survey?.questions) ? data.survey.questions : [];
            const selected =
              responses.find((r) => r.id === selectedResponseId) ||
              responses.find((r, idx) => `${idx}` === selectedResponseId) ||
              responses[0];
            const selectedIndex = responses.findIndex(
              (r, idx) => r.id === selectedResponseId || `${idx}` === selectedResponseId
            );

            const qualityColors = {
              good:    { border: 'border-emerald-500/40', strip: 'bg-emerald-500', chip: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', active: 'border-emerald-500/40 bg-emerald-500/5' },
              suspect: { border: 'border-amber-500/40',   strip: 'bg-amber-500',   chip: 'bg-amber-500/10  text-amber-400  border-amber-500/20',  active: 'border-amber-500/40  bg-amber-500/5'  },
              spam:    { border: 'border-red-500/40',     strip: 'bg-red-500',     chip: 'bg-red-500/10    text-red-400    border-red-500/20',    active: 'border-red-500/40    bg-red-500/5'    },
            };

            return (
              <Card padding="p-0" className="overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                  <div>
                    <h2 className="text-lg font-semibold text-text-1">Response Log</h2>
                    <p className="text-xs text-text-2 mt-0.5">Browse and inspect each individual response</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-2 bg-surface-2 border border-white/5 px-2.5 py-1 rounded-full">
                      {responses.length} {responses.length === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>
                </div>

                {responses.length === 0 ? (
                  <div className="flex h-64 items-center justify-center flex-col gap-3">
                    <MessageSquare size={28} className="text-text-2" />
                    <p className="text-sm text-text-2">No responses yet</p>
                  </div>
                ) : (
                  <div className="grid h-[600px] grid-cols-1 lg:grid-cols-[minmax(0,0.46fr)_minmax(0,0.54fr)]">

                    {/* LIST PANEL */}
                    <div className="h-full overflow-y-auto border-r border-white/[0.06] custom-scrollbar">
                      <div className="p-4 space-y-3">
                        {responses.map((response, index) => {
                          const q = response.quality_label || 'good';
                          const colors = qualityColors[q] || qualityColors.good;
                          const isActive = (response.id || `${index}`) === selectedResponseId;

                          return (
                            <button
                              key={response.id || index}
                              type="button"
                              onClick={() => setSelectedResponseId(response.id || `${index}`)}
                              className={`w-full text-left rounded-xl border overflow-hidden flex transition-all ${
                                isActive
                                  ? `${colors.active} shadow-sm`
                                  : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05]'
                              }`}
                            >
                              {/* quality strip */}
                              <div className={`w-1 flex-shrink-0 ${isActive ? colors.strip : 'bg-white/5'}`} />

                              <div className="flex-1 px-3.5 py-3">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                      isActive ? 'bg-primary text-white' : 'bg-white/5 text-text-2'
                                    }`}>
                                      {index + 1}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-text-1">Response {index + 1}</p>
                                      <p className="text-[11px] text-text-2 mt-0.5">{formatDate(response.date)}</p>
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0 flex items-center gap-1.5">
                                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${colors.chip}`}>
                                      {q}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-2 pl-8">
                                  <div className="flex items-center gap-3 text-[10px] text-text-2">
                                    <span className="flex items-center gap-1">
                                      <Clock3 size={10} />
                                      {response.time}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <CheckCircle2 size={10} />
                                      {Array.isArray(response.answers) ? response.answers.length : 0} answers
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* DETAIL PANEL */}
                    <div className="h-full overflow-y-auto custom-scrollbar">
                      {selected ? (() => {
                        const q = selected.quality_label || 'good';
                        const colors = qualityColors[q] || qualityColors.good;
                        const answerCount = Array.isArray(selected.answers) ? selected.answers.length : 0;
                        const selIdx = selectedIndex >= 0 ? selectedIndex : 0;

                        return (
                          <div className="p-5 flex flex-col gap-4">
                            {/* Detail header */}
                            <div className={`rounded-xl border p-4 ${colors.active}`}>
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-text-2 mb-1">Response {selIdx + 1}</p>
                                  <p className="text-base font-semibold text-text-1">{formatDateTime(selected.date)}</p>
                                </div>
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${colors.chip}`}>
                                  {q}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-3 flex-wrap">
                                <span className="flex items-center gap-1 text-[10px] text-text-2">
                                  <Clock3 size={10} /> {selected.time}
                                </span>
                                <span className="flex items-center gap-1 text-[10px] text-text-2">
                                  <CheckCircle2 size={10} /> {answerCount} answer{answerCount !== 1 ? 's' : ''}
                                </span>
                                <span className="flex items-center gap-1 text-[10px] text-text-2">
                                  <Users size={10} /> {selected.respondent_ip || 'Anonymous'}
                                </span>
                              </div>
                            </div>

                            {/* Answers */}
                            <div className="space-y-3 mt-2">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-2 px-1">Response Data</p>
                              {answerCount === 0 ? (
                                <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-text-2">
                                  No answers recorded for this response
                                </div>
                              ) : (
                                selected.answers.map((answer, aIdx) => {
                                  const question = questions.find(q => q.id === answer.question_id);
                                  const qLabel = question?.text || answer.label || `Question ${aIdx + 1}`;
                                  const qType = question?.type || 'text';
                                  const val = answer.answer_value;

                                  const typeChip = {
                                    rating:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
                                    mcq:       'bg-primary/10 text-primary border-primary/20',
                                    text:      'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                                    text_short:'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                                    text_long: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                                  }[qType] || 'bg-white/5 text-text-2 border-white/10';

                                  return (
                                    <div key={`${answer.question_id || aIdx}`} className="rounded-[16px] border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-5 shadow-sm hover:from-white/[0.05] transition-colors">
                                      <div className="flex items-start gap-2 mb-3">
                                        <span className={`flex-shrink-0 text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${typeChip}`}>
                                          {qType === 'text_short' ? 'text' : qType === 'text_long' ? 'text' : qType}
                                        </span>
                                        <p className="text-xs text-text-2 leading-relaxed">{qLabel}</p>
                                      </div>
                                      {/* Formatted answer value */}
                                      {qType === 'rating' ? (
                                        <div className="flex items-center gap-1.5">
                                          <div className="flex gap-0.5">
                                            {[1,2,3,4,5].map(s => (
                                              <Star
                                                key={s}
                                                size={16}
                                                className={parseInt(val) >= s ? 'text-amber-400 fill-amber-400' : 'text-white/10'}
                                              />
                                            ))}
                                          </div>
                                          <span className="text-sm font-bold text-amber-400">{val}/5</span>
                                        </div>
                                      ) : qType === 'mcq' ? (
                                        <span className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1.5 rounded-lg">
                                          <Target size={11} />
                                          {val || '—'}
                                        </span>
                                      ) : (
                                        <p className="text-sm text-text-1 leading-relaxed">{val || '—'}</p>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {/* Nav between responses */}
                            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                              <button
                                disabled={selIdx === 0}
                                onClick={() => setSelectedResponseId(responses[selIdx - 1]?.id || `${selIdx - 1}`)}
                                className="flex items-center gap-1.5 text-[11px] font-medium text-text-2 hover:text-text-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                ← Previous
                              </button>
                              <span className="text-[10px] text-text-2">{selIdx + 1} of {responses.length}</span>
                              <button
                                disabled={selIdx === responses.length - 1}
                                onClick={() => setSelectedResponseId(responses[selIdx + 1]?.id || `${selIdx + 1}`)}
                                className="flex items-center gap-1.5 text-[11px] font-medium text-text-2 hover:text-text-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                Next →
                              </button>
                            </div>
                          </div>
                        );
                      })() : null}
                    </div>
                  </div>
                )}
              </Card>
            );
          })()}
          {activeTab === 'insights' && (() => {
            const insightIconMap = {
              confidence: Zap,
              engagement: TrendingUp,
              speed: Timer,
              dropout: AlertTriangle,
              consensus: Target,
              rating: Star,
              keywords: Tag,
              sentiment: MessageSquare,
              evidence: Quote,
            };
            const iconBgMap = {
              emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
              amber:   'bg-amber-500/10  border-amber-500/20  text-amber-400',
              red:     'bg-red-500/10    border-red-500/20    text-red-400',
              indigo:  'bg-primary/10   border-primary/20   text-primary',
            };
            const cardBorderMap = {
              emerald: 'border-emerald-500/15',
              amber:   'border-amber-500/15',
              red:     'border-red-500/15',
              indigo:  'border-primary/15',
            };
            return (
              <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                {/* INSIGHT FEED */}
                <Card padding="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-semibold text-text-1">Insight Feed</h2>
                      <p className="text-xs text-text-2 mt-0.5">All signals extracted from your response set</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-2 bg-surface-2 border border-white/5 px-2.5 py-1 rounded-full">
                      {realInsights.length} signals
                    </span>
                  </div>
                  <div className="space-y-2">
                    {realInsights.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
                        <Sparkles size={22} className="text-text-2 mx-auto mb-3" />
                        <p className="text-sm font-medium text-text-1">No insights yet</p>
                        <p className="text-xs text-text-2 mt-1">Collect more responses to unlock signals</p>
                      </div>
                    ) : (
                      realInsights.map((insight, index) => {
                        const Icon = insightIconMap[insight.type] || Lightbulb;
                        const iconBg = iconBgMap[insight.color] || 'bg-white/5 border-white/10 text-text-2';
                        const cardBorder = cardBorderMap[insight.color] || 'border-white/5';
                        const borderLeftMap = {
                          emerald: 'border-l-emerald-500',
                          amber:   'border-l-amber-500',
                          red:     'border-l-red-500',
                          indigo:  'border-l-primary',
                        };
                        const leftBorder = borderLeftMap[insight.color] || 'border-l-white/10';
                        return (
                          <div
                            key={`${insight.text}-${index}`}
                            className={`rounded-xl border border-l-[3px] bg-gradient-to-r from-white/[0.04] to-transparent p-4 flex gap-4 hover:bg-white/[0.06] transition-colors ${cardBorder} ${leftBorder}`}
                          >
                            <div className={`flex-shrink-0 h-10 w-10 shadow-sm rounded-xl border flex items-center justify-center ${iconBg}`}>
                              <Icon size={15} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${iconBg}`}>
                                  {insight.type}
                                </span>
                                <span className="text-[10px] text-text-2 truncate" title={insight.question}>
                                  {insight.question}
                                </span>
                              </div>
                              <p className="text-sm text-text-1 leading-relaxed">{insight.text}</p>
                              {/* Rating distribution mini-bars */}
                              {insight.type === 'rating' && insight.value?.dist && (
                                <div className="mt-3 space-y-1">
                                  {insight.value.dist.slice().reverse().map(({ star, pct }) => (
                                    <div key={star} className="flex items-center gap-2">
                                      <span className="text-[10px] text-text-2 w-4 text-right">{star}★</span>
                                      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${star >= 4 ? 'bg-emerald-400' : star === 3 ? 'bg-amber-400' : 'bg-red-400'}`}
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                      <span className="text-[10px] text-text-2 w-7">{pct}%</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {/* MCQ top options */}
                              {insight.type === 'consensus' && insight.value?.all && (
                                <div className="mt-3 space-y-1">
                                  {insight.value.all.map(({ opt, pct }) => (
                                    <div key={opt} className="flex items-center gap-2">
                                      <span className="text-[10px] text-text-2 truncate max-w-[100px]">{opt}</span>
                                      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                                      </div>
                                      <span className="text-[10px] text-text-2 w-7">{pct}%</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {/* Keyword tags */}
                              {insight.type === 'keywords' && Array.isArray(insight.value) && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {insight.value.map(({ word, count }) => (
                                    <span key={word} className="inline-flex items-center gap-1 text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full">
                                      {word}
                                      <span className="opacity-60">{count}x</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>

                {/* STATS PANEL */}
                <div className="space-y-4">
                  <Card padding="p-6">
                    <h2 className="text-base font-semibold text-text-1 mb-4">Response Stats</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-[16px] border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-2">Total</p>
                        <p className="text-3xl font-display font-bold text-text-1 mt-2">{data.stats.responses}</p>
                        <p className="text-xs font-medium text-text-2 mt-1">{responseRate}</p>
                      </div>
                      <div className="rounded-[16px] border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-2">Avg Time</p>
                        <p className="text-3xl font-display font-bold text-text-1 mt-2">{data.stats.avgTime}</p>
                        <p className="text-xs font-medium text-text-2 mt-1">{data.stats.completionRate}% completed</p>
                      </div>
                      <div className="rounded-[16px] border border-emerald-500/15 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/60">Clean</p>
                        <p className="text-3xl font-display font-bold text-emerald-400 mt-2">{qualityBreakdown.good}</p>
                        <p className="text-xs font-medium text-emerald-500/60 mt-1">Good quality</p>
                      </div>
                      <div className={`rounded-[16px] border bg-gradient-to-br p-5 ${
                        qualityBreakdown.suspect + qualityBreakdown.spam > 0
                          ? 'border-amber-500/15 from-amber-500/10 to-transparent'
                          : 'border-white/[0.06] from-white/[0.04] to-transparent'
                      }`}>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${
                          qualityBreakdown.suspect + qualityBreakdown.spam > 0 ? 'text-amber-400/60' : 'text-text-2'
                        }`}>Flagged</p>
                        <p className={`text-3xl font-display font-bold mt-2 ${
                          qualityBreakdown.suspect + qualityBreakdown.spam > 0 ? 'text-amber-400' : 'text-text-1'
                        }`}>{qualityBreakdown.suspect + qualityBreakdown.spam}</p>
                        <p className={`text-xs font-medium mt-1 ${
                          qualityBreakdown.suspect + qualityBreakdown.spam > 0 ? 'text-amber-500/60' : 'text-text-2'
                        }`}>Suspect + spam</p>
                      </div>
                    </div>
                  </Card>

                  {/* Insight type breakdown */}
                  <Card padding="p-6">
                    <h2 className="text-base font-semibold text-text-1 mb-4">Signal Breakdown</h2>
                    <div className="space-y-3">
                      {(() => {
                        const counts = [
                          { type: 'confidence', label: 'Confidence', Icon: Zap },
                          { type: 'engagement', label: 'Engagement', Icon: TrendingUp },
                          { type: 'consensus',  label: 'Consensus',  Icon: Target },
                          { type: 'rating',     label: 'Rating',     Icon: Star },
                          { type: 'keywords',   label: 'Keywords',   Icon: Tag },
                          { type: 'sentiment',  label: 'Sentiment',  Icon: MessageSquare },
                          { type: 'speed',      label: 'Speed',      Icon: Timer },
                          { type: 'dropout',    label: 'Dropout',    Icon: AlertTriangle },
                          { type: 'evidence',   label: 'Evidence',   Icon: Quote },
                        ].map(item => ({...item, count: realInsights.filter(i => i.type === item.type).length})).filter(i => i.count > 0);

                        if (counts.length === 0) return <div className="text-sm text-text-2 text-center py-4">No signals generated yet.</div>;
                        const maxCount = Math.max(...counts.map(c => c.count), 1);

                        return counts.map(({ type, label, Icon, count }) => (
                          <div key={type} className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-surface-2 border border-[var(--color-border)] flex items-center justify-center text-text-2 shadow-sm">
                              <Icon size={14} />
                            </div>
                            <span className="text-[13px] font-medium text-text-2 w-[80px]">{label}</span>
                            <span className="text-[13px] font-bold text-text-1 w-[20px] text-right mr-3">{count}</span>
                            <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-indigo-500 transition-all duration-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                                style={{ width: `${(count / maxCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </Card>
                </div>
              </div>
            );
          })()}

          {activeTab === 'quality' && (
            <div className="space-y-6">
              <Card padding="p-6 sm:p-8" className="relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10 blur-3xl rounded-full bg-emerald-500 pointer-events-none" />
                <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="font-display text-2xl text-text-1">Quality control</h2>
                    <p className="mt-2 text-sm text-text-2">A cleaner moderation view for suspect submissions, spam, and response reliability.</p>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest ${
                    flaggedResponses.length === 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  }`}>
                    {flaggedResponses.length === 0 ? 'No risks found' : `${flaggedResponses.length} flagged`}
                  </div>
                </div>
              </Card>

              <div className="grid gap-4">
                {flaggedResponses.length === 0 ? (
                  <div className="rounded-[24px] border border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 to-transparent p-16 relative overflow-hidden flex flex-col items-center text-center shadow-[0_0_40px_rgba(16,185,129,0.05)]">
                    <div className="absolute top-0 inset-x-0 h-[100px] bg-emerald-500/20 blur-[80px]" />
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="font-display text-3xl font-bold text-text-1">Everything looks healthy</h3>
                    <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-text-2">No suspect or spam patterns were detected in the current response set. Responses appear genuine and properly formatted.</p>
                  </div>
                ) : (
                  flaggedResponses.map((item) => (
                    <div key={item.id} className="rounded-xl border border-white/[0.06] bg-gradient-to-r from-white/[0.04] to-transparent p-5 sm:p-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between transition-colors hover:bg-white/[0.06]">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-1 rounded-sm bg-amber-500" />
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <span className="font-mono text-[11px] font-medium text-text-2 bg-black/20 px-2 py-0.5 rounded border border-white/5">#{item.id}</span>
                            <h3 className="text-lg font-bold text-text-1">{item.respondent}</h3>
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                              item.status === 'quarantined' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>{item.status}</span>
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-text-2 mb-1">{item.flag}</p>
                          <p className="text-sm leading-relaxed text-text-1/90">{item.desc}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="secondary" className="!px-4">Review log</Button>
                        <Button variant={item.status === 'quarantined' ? 'secondary' : 'danger'} className="!px-4">
                          {item.status === 'quarantined' ? 'Release' : 'Quarantine'}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'distribution' && (
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[32px] border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-7 sm:p-8 flex flex-col items-center">
                <div className="w-full mb-6 text-center">
                  <h3 className="font-display text-xl font-bold text-text-1 mb-1">Share your survey</h3>
                  <p className="text-sm text-text-2">Scan or distribute this QR code instantly</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Public Survey</p>
                      <h4 className="font-display text-lg font-bold text-slate-800 mt-0.5 truncate max-w-[150px]">{data.survey.title}</h4>
                    </div>
                    <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-primary/20">
                      Live
                    </span>
                  </div>
                  <div className="flex justify-center rounded-[20px] bg-slate-50 p-4 border border-slate-100">
                    <QRCodeSVG id="qr-code-svg" value={surveyLink} size={220} bgColor="#f8fafc" fgColor="#0f172a" level="H" />
                  </div>
                </div>
              </div>

              <Card padding="p-7 sm:p-8" className="flex flex-col justify-center border border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-transparent">
                <div className="mb-6">
                  <h3 className="font-display text-2xl font-bold text-text-1">Distribution link</h3>
                  <p className="text-sm text-text-2 mt-2 leading-relaxed">Everything needed to launch this survey from one polished panel. Drop this link in emails, chat, or socials.</p>
                </div>
                <div className="space-y-4">
                  <div className="rounded-[20px] border border-white/10 bg-black/20 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-2 mb-3">Shareable link</p>
                    <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 font-mono text-[13px] text-primary break-all">
                      {surveyLink}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button variant="secondary" onClick={handleCopyLink} className="h-12 border-white/10 bg-white/[0.03] hover:bg-white/[0.06]">
                      <Copy size={16} />
                      <span className="font-semibold">Copy URL</span>
                    </Button>
                    <Button variant="primary" onClick={handleDownloadQR} className="h-12 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                      <Download size={16} />
                      <span className="font-semibold">Download QR</span>
                    </Button>
                  </div>
                  <div className="mt-4 rounded-[20px] border border-white/5 bg-white/[0.02] p-4 flex gap-4 items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <Users size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-1">Audience ready</p>
                      <p className="text-xs text-text-2 mt-0.5">Use this link to start collecting feedback.</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </>
      </div>
    </AppShell>
  );
}
