import { useState, useCallback, useEffect, useMemo } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useNavigate } from 'react-router-dom';

import { MessageSquare, Pause, BarChart2, Clock, Bot, User, Settings2, Sparkles } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useWebSocket } from '../hooks/useWebSocket';
import { getConversationalSessions } from '../api/analyticsApi';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '../context/ToastContext';

const STATUS_CONFIG = {
  'in-progress': { label: 'In Progress', variant: 'amber', dot: true },
  'completed':   { label: 'Completed',   variant: 'emerald', dot: false },
  'abandoned':   { label: 'Abandoned',   variant: 'red', dot: false },
};

export default function ConversationsPage() {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [qualityFilter, setQualityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 40;
  const toast = useToast();
  usePageTitle('Conversations');

  const handleExport = useCallback(() => {
    if (!selected || !selected.messages) return;
    const rows = [['sender', 'message']];
    selected.messages.forEach(m => {
      rows.push([m.from, `"${(m.text || '').replace(/"/g, '""')}"`]);
    });
    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${selected.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Transcript exported to CSV!');
  }, [selected, toast]);

  const handlePause = useCallback(() => {
    toast.warning('Session paused. Respondent will be halted gracefully.');
  }, [toast]);

  const navigate = useNavigate();

  const handleConfigure = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  const fetchSessions = useCallback(async ({ append = false, nextOffset = 0 } = {}) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const query = new URLSearchParams();
      query.set('limit', String(pageSize));
      query.set('offset', String(nextOffset));
      if (qualityFilter !== 'all') query.set('quality', qualityFilter);
      if (filter !== 'all') query.set('status', filter);
      const data = await getConversationalSessions(query.toString());
      const next = Array.isArray(data) ? data : [];
      if (append) {
        setSessions(prev => [...prev, ...next]);
      } else {
        setSessions(next);
      }
      setHasMore(next.length >= pageSize);
      setOffset(nextOffset + next.length);
    } catch (err) {
      console.error('Failed to load sessions', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter, qualityFilter, pageSize]);

  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchSessions({ append: false, nextOffset: 0 });
  }, [fetchSessions]);

  const onWsMessage = useCallback((msg) => {
    if (msg.type === 'survey:start') {
      setSessions(prev => {
        const exists = prev.find(s => s.id === msg.sessionId);
        if (exists) return prev;
        return [{
          id: msg.sessionId,
          survey: msg.surveyTitle || msg.surveyId,
          respondent: msg.respondent || 'Live Active User',
          started: new Date(msg.time).toISOString(),
          duration: '0s',
          progress: 5,
          status: 'in-progress',
          messages: []
        }, ...prev].slice(0, 50);
      });
    } else if (msg.type === 'survey:progress') {
      setSessions(prev => prev.map(s => {
        if (s.id === msg.sessionId) {
          return {
            ...s,
            progress: msg.percent,
            messages: [
              ...s.messages,
              { from: 'bot', text: msg.question },
              { from: 'user', text: msg.answer }
            ]
          };
        }
        return s;
      }));
      // Update selected if applicable
      setSelected(prev => {
        if (prev && prev.id === msg.sessionId) {
          return {
            ...prev,
            progress: msg.percent,
            messages: [
              ...prev.messages,
              { from: 'bot', text: msg.question },
              { from: 'user', text: msg.answer }
            ]
          };
        }
        return prev;
      });
    } else if (msg.type === 'survey:complete') {
      setSessions(prev => prev.map(s => {
        if (s.id === msg.sessionId) {
          return {
            ...s,
            status: 'completed',
            progress: 100,
            messages: [
              ...s.messages,
              { from: 'bot', text: 'Thank you for taking the time to complete our survey!' }
            ]
          };
        }
        return s;
      }));
      setSelected(prev => {
        if (prev && prev.id === msg.sessionId) {
          return {
            ...prev,
            status: 'completed',
            progress: 100,
            messages: [
              ...prev.messages,
              { from: 'bot', text: 'Thank you for taking the time to complete our survey!' }
            ]
          };
        }
        return prev;
      });
    }
  }, []);

  useWebSocket(onWsMessage);

  const filtered = useMemo(() => sessions, [sessions]);
  const liveCount = sessions.filter(s => s.status === 'in-progress').length;

  return (
    <AppShell>
      <div className="glass-panel rounded-[var(--radius-xl)] p-6 sm:p-8 mb-5 shadow-sm">
        <div className="max-w-[1320px] mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="glass">Conversations</Badge>
              <Badge variant="glass" dot>Live</Badge>
            </div>
            <h1 className="text-2xl font-display font-semibold text-text-1">Live Conversations</h1>
            <p className="text-sm text-text-2 mt-1 max-w-xl">Monitor real-time respondent sessions across conversational surveys.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-success/30 bg-success/10 text-success text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-success" />
              {liveCount} Live Now
            </div>
            <Button variant="secondary" className="gap-2 bg-surface text-text-1 border border-white/10 hover:border-white/25 transition-all" onClick={handleConfigure}>
              <Settings2 size={15}/> Configure
            </Button>
          </div>
        </div>
      </div>

      {/* ── MAIN SPLIT LAYOUT ── */}
      <div className="flex flex-col lg:flex-row gap-6 min-h-[560px]">

        {/* ── LEFT: SESSION LIST ── */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col">
          {/* Filters Bar */}
          <div className="flex flex-col gap-4 mb-5">
            <div className="grid grid-cols-2 gap-2 w-full">
              {['all','in-progress','completed','abandoned'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2.5 rounded-xl text-[11px] font-bold tracking-wide uppercase transition-all duration-300 text-center shadow-sm ${filter === f ? 'bg-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-surface-2 text-text-2 hover:bg-surface-3 hover:text-text-1 border border-white/5 hover:border-white/20'}`}>
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-1 rounded-xl border border-white/5 bg-surface-2/50 p-1 w-full overflow-x-auto custom-scrollbar">
              {['all', 'good', 'suspect', 'spam'].map(q => (
                <button
                  key={q}
                  onClick={() => setQualityFilter(q)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 flex-1 text-center shrink-0 ${qualityFilter === q ? 'bg-primary text-white shadow-glow' : 'text-text-2 hover:bg-surface-2 hover:text-text-1'}`}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          <Card glass padding="p-0" className="flex-1 overflow-hidden flex flex-col border border-white/10 shadow-lg">
            <div className="overflow-y-auto flex-1 divide-y divide-white/5 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-8 h-full text-center text-text-2">
                  <div className="w-12 h-12 mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <Sparkles size={24} className="text-primary animate-custom-spin" />
                  </div>
                  <p className="text-sm font-bold text-text-1">Loading sessions</p>
                  <p className="text-xs mt-1 max-w-[200px]">Fetching the latest conversational activity.</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 h-full text-center text-text-2">
                  <div className="w-16 h-16 rounded-[var(--radius-xl)] bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                    <Bot size={28} className="text-text-2 opacity-50" />
                  </div>
                  <p className="text-base font-bold text-text-1">No active sessions</p>
                  <p className="text-sm mt-2 max-w-[240px] leading-relaxed">Waiting for real-time respondents to engage with your conversational surveys.</p>
                </div>
              ) : filtered.map(session => (
                <button
                  key={session.id}
                  onClick={() => setSelected(session)}
                  className={`w-full text-left p-4 hover:bg-white/[0.04] transition-all duration-300 border-l-[3px] ${selected?.id === session.id ? 'bg-primary/[0.08] border-primary' : 'border-transparent bg-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-semibold text-text-1 truncate pr-2">{session.survey}</p>
                    <Badge variant={STATUS_CONFIG[session.status]?.variant || 'amber'} dot={STATUS_CONFIG[session.status]?.dot} className="!text-[9px] shrink-0">
                      {STATUS_CONFIG[session.status]?.label || session.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-2 font-mono mb-2">{session.respondent}</p>
                  <div className="flex items-center justify-between text-xs text-text-2">
                    <span className="flex items-center gap-1"><Clock size={10}/> {
                      session.started.includes('Z') || session.started.includes('T') 
                        ? formatDistanceToNow(new Date(session.started)) + ' ago' 
                        : session.started
                    }</span>
                    <span>{session.progress}% complete</span>
                  </div>
                  <div className="w-full h-1 bg-surface-2 rounded-full mt-2 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${session.status === 'abandoned' ? 'bg-danger' : session.status === 'completed' ? 'bg-success' : 'bg-primary'}`}
                      style={{ width: `${session.progress}%` }} />
                  </div>
                </button>
              ))}
            </div>
          </Card>
          {hasMore && (
            <Button
              variant="ghost"
              className="mt-3 !text-xs"
              onClick={() => fetchSessions({ append: true, nextOffset: offset })}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </Button>
          )}
        </div>

        {/* ── RIGHT: CHAT VIEWER ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {selected ? (
              <div className="flex flex-col h-full">
                {/* Session Header */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4 shrink-0 p-5 glass-panel rounded-[var(--radius-xl)] border border-white/10 shadow-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="relative z-10">
                    <h2 className="text-lg font-display font-bold text-text-1 flex items-center gap-2">
                       {selected.survey}
                    </h2>
                    <p className="text-[11px] font-medium text-text-2 flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-primary">{selected.respondent}</span>
                      <span className="flex items-center gap-1 uppercase tracking-wider"><Clock size={10}/> {selected.duration}</span>
                      <Badge variant={selected.quality_label === 'good' ? 'emerald' : selected.quality_label === 'suspect' ? 'amber' : 'red'} className="!text-[9px] uppercase tracking-widest font-bold">
                        {selected.quality_label || 'good'}
                      </Badge>
                    </p>
                  </div>
                  <div className="flex gap-2 relative z-10">
                    <Button variant="ghost" onClick={handleExport} className="border border-white/10 !px-4 gap-2 !text-xs hover:border-white/20 transition-all hover:-translate-y-0.5">
                      <BarChart2 size={14}/> Export
                    </Button>
                    {selected.status === 'in-progress' && (
                      <Button variant="danger" onClick={handlePause} className="!px-4 gap-2 !text-xs border border-danger/50 hover:-translate-y-0.5 transition-all">
                        <Pause size={14}/> Pause
                      </Button>
                    )}
                  </div>
                </div>

                {/* Chat Bubbles */}
                <div className="flex-1 overflow-y-auto space-y-5 p-6 custom-scrollbar glass-panel rounded-[var(--radius-xl)] border border-white/10 shadow-inner relative bg-surface/[0.98]">
                  {selected.messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 animate-fade-in ${msg.from === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center shadow-lg ${msg.from === 'bot' ? 'bg-primary text-white' : 'bg-surface-3 text-text-1'}`}>
                        {msg.from === 'bot' ? <Bot size={14}/> : <User size={14}/>}
                      </div>
                      <div className={`max-w-[80%] px-5 py-3.5 text-[14px] leading-relaxed relative ${
                        msg.from === 'bot'
                          ? 'bg-surface-2 text-text-1 rounded-2xl rounded-tl-sm border border-white/5'
                          : 'bg-primary/10 text-primary rounded-2xl rounded-tr-sm border border-primary/20'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {selected.status === 'in-progress' && (
                    <div className="flex gap-3 animate-fade-in px-1">
                      <div className="w-8 h-8 rounded-full shadow-lg bg-primary text-white flex items-center justify-center">
                        <Bot size={14}/>
                      </div>
                      <div className="px-5 py-3.5 rounded-2xl rounded-tl-sm bg-surface-2 border border-white/5 flex items-center gap-1.5 h-12">
                        <span className="w-2 h-2 rounded-full bg-text-2 animate-bounce" style={{animationDelay:'0ms'}}/>
                        <span className="w-2 h-2 rounded-full bg-text-2 animate-bounce" style={{animationDelay:'150ms'}}/>
                        <span className="w-2 h-2 rounded-full bg-text-2 animate-bounce" style={{animationDelay:'300ms'}}/>
                      </div>
                    </div>
                  )}
                </div>
              </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-text-2 glass-panel rounded-[var(--radius-xl)] border border-white/10 shadow-sm">
              <div className="animate-fade-in">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[var(--radius-xl)] bg-primary/5 text-primary border border-primary/10 shadow-[0_0_40px_rgba(99,102,241,0.1)]">
                  <MessageSquare size={32} />
                </div>
                <p className="font-semibold">Select a session to view the conversation</p>
                <p className="text-xs text-text-2 mt-2">Pick a live session from the left to view the full transcript.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
