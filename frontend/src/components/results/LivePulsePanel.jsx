import { usePulse } from '../../hooks/usePulse';

export default function LivePulsePanel({ surveyId }) {
  const { data, isLoading, error, hasNewResponse } = usePulse(surveyId);

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 mb-6 shadow-[var(--shadow-sm)] flex items-center gap-3">
        <div className="w-4 h-4 rounded-full bg-[var(--border-strong)] animate-custom-pulse" />
        <span className="text-[14px] font-medium text-[var(--text-muted)] tracking-wide">Connecting to live pulse...</span>
      </div>
    );
  }

  if (error || !data) {
    return null; // hide gracefully if no live data
  }

  const { total_responses: total, velocity, responses_last_hour: lastHour, responses_last_24h: last24h } = data;

  const getVelocityStyles = () => {
    if (velocity === 'accelerating') return { text: 'text-[var(--success)]', bg: 'bg-[var(--success-bg)]', badge: 'Accelerating ↑' };
    if (velocity === 'slowing') return { text: 'text-[var(--danger)]', bg: 'bg-[var(--danger-bg)]', badge: 'Slowing ↓' };
    return { text: 'text-[var(--warning)]', bg: 'bg-[var(--warning-bg)]', badge: 'Steady —' };
  };
  const vStyle = getVelocityStyles();

  return (
    <div className={`bg-[var(--bg-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] border overflow-hidden mb-6 transition-colors duration-500 ${hasNewResponse ? 'border-[var(--success)] bg-[var(--success-bg)]' : 'border-[var(--border)]'}`}>
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-6 h-6">
            <div className={`absolute inset-0 rounded-full opacity-30 ${velocity === 'accelerating' ? 'bg-[var(--success)] animate-custom-pulse' : 'bg-[var(--border-strong)]'}`} />
            <div className={`w-2.5 h-2.5 rounded-full z-10 ${velocity === 'accelerating' ? 'bg-[var(--success)]' : 'bg-[var(--border-strong)]'}`} />
          </div>
          <span className="text-[13px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Live Pulse
          </span>
          <span className="text-[15px] font-bold text-[var(--text-primary)]">
            {total} responses
          </span>
        </div>

        <div className="flex items-center gap-3 text-[13px] font-semibold">
          <span className={`px-2.5 py-1 rounded-sm uppercase tracking-wider text-[10px] bg-[var(--bg-muted)] ${vStyle.text}`}>
            {vStyle.badge}
          </span>
          <span className="text-[var(--text-secondary)]">
            {lastHour} / hr
          </span>
          <span className="text-[var(--border-strong)]">|</span>
          <span className="text-[var(--text-secondary)]">
            {last24h} / 24h
          </span>
        </div>

      </div>
    </div>
  );
}
