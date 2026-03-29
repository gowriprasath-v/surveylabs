import { usePulse } from '../../hooks/usePulse';

export default function LivePulsePanel({ surveyId }) {
  const { data, isLoading, error, hasNewResponse } = usePulse(surveyId);

  if (isLoading) {
    return (
      <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-300 animate-pulse" />
          <span className="text-[13px] font-medium text-gray-500 tracking-wide">Connecting to live pulse...</span>
        </div>
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
    <div className={`rounded-xl border mb-6 transition-colors duration-500 ${hasNewResponse ? 'border-green-400 bg-green-50/50 shadow-[0_0_15px_rgba(74,222,128,0.15)]' : 'border-gray-200 bg-white shadow-sm'}`}>
      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex items-center justify-center w-5 h-5">
            <div className={`absolute inset-0 rounded-full opacity-30 ${velocity === 'accelerating' ? 'bg-green-500 animate-custom-pulse' : 'bg-gray-300'}`} />
            <div className={`w-2 h-2 rounded-full z-10 ${velocity === 'accelerating' ? 'bg-green-500' : 'bg-gray-400'}`} />
          </div>
          <span className="text-[12px] font-bold uppercase tracking-widest text-gray-500">
            Live Pulse
          </span>
          <span className="text-[15px] font-bold text-gray-900 ml-1">
            {total} <span className="text-gray-400 font-semibold text-[13px] tracking-normal">Responses</span>
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-[12px] font-medium">
          <span className={`px-2 py-0.5 rounded uppercase tracking-wider text-[10px] font-bold ${vStyle.bg} ${vStyle.text}`}>
            {vStyle.badge}
          </span>
          <span className="text-gray-500">
            <span className="font-bold text-gray-700">{lastHour}</span> / hr
          </span>
          <span className="text-gray-300 font-light">|</span>
          <span className="text-gray-500">
            <span className="font-bold text-gray-700">{last24h}</span> / 24h
          </span>
        </div>

      </div>
    </div>
  );
}
