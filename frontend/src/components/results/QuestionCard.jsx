import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ── STEP 6A: MCQ DATA ──
const getMCQData = (question, responses) => {
  const counts = {};
  (question.options || []).forEach(opt => { counts[opt] = 0; });
  responses.forEach(r => {
    const ans = r.answers?.find(a => a.question_id === question.id);
    if (ans?.answer_value) {
      counts[ans.answer_value] = (counts[ans.answer_value] || 0) + 1;
    }
  });
  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  return Object.entries(counts)
    .map(([name, value]) => ({
      name,
      value,
      pct: total > 0 ? Math.round((value / total) * 100) : 0
    }))
    .sort((a, b) => b.value - a.value);
};

// ── STEP 7A: RATING DATA ──
const getRatingData = (question, responses) => {
  const dist = { 1:0, 2:0, 3:0, 4:0, 5:0 };
  let sum = 0, count = 0;
  responses.forEach(r => {
    const ans = r.answers?.find(a => a.question_id === question.id);
    const val = parseInt(ans?.answer_value);
    if (val >= 1 && val <= 5) {
      dist[val]++;
      sum += val;
      count++;
    }
  });
  const avg = count > 0 ? sum / count : 0;
  const sentiment =
    avg >= 4 ? { label: 'Positive', color: 'text-green-600',
      bg: 'bg-green-100' } :
    avg >= 3 ? { label: 'Mixed',    color: 'text-amber-600',
      bg: 'bg-amber-100' } :
               { label: 'Negative', color: 'text-red-600',
      bg: 'bg-red-100' };
  return {
    avg,
    avgDisplay: avg.toFixed(1),
    dist: [1,2,3,4,5].map(star => ({
      name: `${star}★`,
      count: dist[star],
      fill: star <= 2 ? '#EF4444' : star === 3 ? '#F59E0B' : '#10B981'
    })),
    sentiment,
    count
  };
};

// ── STEP 8A: KEYWORD EXTRACTOR ──
const STOPWORDS = new Set([
  'the','a','an','is','it','in','on','at','to','for','of','and','or',
  'i','we','my','our','this','that','was','are','be','been','have',
  'has','do','did','not','but','so','if','as','by','with','very',
  'just','really','also','would','could','should','more','some',
  'what','when','how','there','they','them','get','can','will','its'
]);

const extractKeywords = (answers, topN = 10) => {
  const freq = {};
  answers.forEach(ans => {
    if (!ans || typeof ans !== 'string') return;
    ans.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length >= 4 && !STOPWORDS.has(w))
      .forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  });
  return Object.entries(freq)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }));
};

// ── STEP 8B: TEXT AGGREGATOR ──
const getTextAggregation = (question, responses, limit = 20) => {
  const all = responses
    .map(r => r.answers?.find(a => a.question_id === question.id)
      ?.answer_value)
    .filter(Boolean);

  const freq = {};
  all.forEach(v => {
    const key = v.trim().toLowerCase();
    if (!freq[key]) freq[key] = { display: v.trim(), count: 0 };
    freq[key].count++;
  });

  const aggregated = Object.values(freq)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  const keywords = extractKeywords(all, 8);

  const posWords = new Set(['good','great','excellent','love','best',
    'amazing','helpful','easy','fast','happy','satisfied','perfect']);
  const negWords = new Set(['bad','poor','slow','difficult','hard',
    'confusing','terrible','worst','hate','disappointing','broken']);

  let posCount = 0, negCount = 0;
  all.forEach(ans => {
    const lower = ans.toLowerCase();
    const words = lower.split(/\s+/);
    if (words.some(w => posWords.has(w))) posCount++;
    else if (words.some(w => negWords.has(w))) negCount++;
  });
  const total = all.length;
  const sentiment =
    posCount / total > 0.5 ? { label: 'Mostly Positive',
      color: 'text-green-600', bg: 'bg-green-100' } :
    negCount / total > 0.5 ? { label: 'Mostly Negative',
      color: 'text-red-600', bg: 'bg-red-100' } :
    { label: 'Mixed Sentiment', color: 'text-amber-600',
      bg: 'bg-amber-100' };

  return { aggregated, keywords, sentiment, total: all.length };
};

// ── STEP 10: UNIFIED QUESTION CARD ──
export default function QuestionCard({ question, index, viewMode, filteredResponses }) {
  // UPDATED — unified card for ALL question types
  return (
    <div
      key={question.id}
      className="
        bg-white
        border border-gray-200 shadow-sm
        rounded-xl
        p-5 sm:p-6 space-y-5 sm:space-y-6
      "
    >
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-semibold uppercase
              tracking-widest text-gray-400">
              Q{index + 1}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5
              rounded-full
              ${question.type === 'mcq'
                ? 'bg-indigo-50 text-indigo-600'
                : question.type === 'rating'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-purple-50 text-purple-600'}`}>
              {question.type.toUpperCase()}
            </span>
          </div>
          <h3 className="text-base font-semibold text-gray-900
            leading-snug">
            {question.text || question.label}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {filteredResponses.length} response
            {filteredResponses.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── CONTENT (controlled by global viewMode) ── */}
      <div className="w-full">
        
        {/* MCQ RENDER */}
        {viewMode === 'chart' && question.type === 'mcq' && (() => {
          const data = getMCQData(question, filteredResponses);
          const total = data.reduce((s, d) => s + d.value, 0);
          const top = data[0];
          const consensusLabel = top?.pct > 60
            ? 'Strong consensus'
            : top?.pct > 40
            ? 'Moderate consensus'
            : 'No clear consensus';
          const consensusColor = top?.pct > 60
            ? 'bg-green-100 text-green-700'
            : top?.pct > 40
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-500';

          return (
            <div className="space-y-4">
              {top && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                  <span className={`inline-flex items-center self-start sm:self-auto text-xs font-semibold px-2 py-0.5
                    rounded-md ${consensusColor}`}>
                    {consensusLabel}
                  </span>
                  <span className="text-xs font-medium text-gray-500 truncate">
                    {top.name} leads at {top.pct}%
                  </span>
                </div>
              )}
              <div className="w-full mt-5">
                <div className="flex flex-col gap-3 w-full">
                  {data.map((item, idx) => {
                    const isTop = idx === 0 && item.value > 0;
                    const maxVal = top?.value || 1;
                    const barWidth = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
                    
                    return (
                      <div key={item.name} className="flex items-center gap-2 sm:gap-3 w-full group">
                        
                        {/* LABEL COLUMN */}
                        <div className="w-[48px] sm:w-[60px] shrink-0 text-right">
                          <span className={`text-[11px] sm:text-[13px] font-medium truncate block w-full
                            ${isTop ? 'text-gray-900 font-semibold' : 'text-gray-500'}`} 
                            title={item.name}
                          >
                            {item.name}
                          </span>
                        </div>
                        
                        {/* BAR CONTAINER */}
                        <div className="flex-1 flex items-center h-5 sm:h-7 opacity-90 group-hover:opacity-100 transition-opacity">
                          <div 
                            className={`h-full rounded-r sm:rounded-r-md transition-all duration-700 ease-out shadow-sm
                              ${isTop ? 'bg-indigo-500' : 'bg-indigo-100 group-hover:bg-indigo-200'}`}
                            style={{ 
                              width: `${barWidth}%`, 
                              minWidth: item.value > 0 ? '8px' : '0px'
                            }}
                          />
                          
                          <div className="ml-2.5 sm:ml-3 flex items-center gap-1.5 shrink-0">
                            <span className="text-[11px] sm:text-[13px] font-bold text-gray-700">
                              {item.value}
                            </span>
                            <span className="text-[10px] sm:text-[11px] font-medium text-gray-400">
                              ({item.pct}%)
                            </span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {viewMode === 'raw' && question.type === 'mcq' && (() => {
          const data = getMCQData(question, filteredResponses);
          const topValue = data[0]?.value || 0;
          return (
            <div className="space-y-3">
              {data.map(({ name, value, pct }, idx) => {
                const isDominant = value > 0 && value === topValue && idx === 0;
                return (
                  <div key={name}
                    className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 rounded-xl border transition-all duration-300 ${
                      isDominant 
                        ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' 
                        : 'bg-white border-gray-100 opacity-80 hover:opacity-100 hover:border-gray-200'
                    }`}>
                    
                    <div className="w-full sm:w-1/3 flex-shrink-0 flex items-center flex-wrap gap-2 sm:pr-2">
                      <span className={`text-sm break-words ${
                        isDominant ? 'font-semibold text-emerald-900' : 'font-medium text-gray-700'
                      }`}>
                        {name}
                      </span>
                      {isDominant && (
                        <span className="shrink-0 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md flex items-center bg-emerald-200/50 text-emerald-800">
                          Top choice
                        </span>
                      )}
                    </div>

                    <div className="w-full sm:flex-grow flex items-center">
                      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ease-out ${
                            isDominant ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="w-full sm:w-20 flex-shrink-0 flex items-center justify-between sm:justify-end gap-2">
                      <span className={`text-sm font-semibold ${isDominant ? 'text-emerald-900' : 'text-gray-900'}`}>
                        {pct}%
                      </span>
                      <span className="text-xs text-gray-400 w-auto sm:w-6 text-right font-medium">
                        {value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* RATING RENDER */}
        {viewMode === 'chart' && question.type === 'rating' && (() => {
          const { avg, avgDisplay, dist, sentiment, count } =
            getRatingData(question, filteredResponses);
          const filledStars = Math.round(avg);

          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900 leading-none">
                    {avgDisplay}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">out of 5</p>
                </div>
                <div>
                  <div className="flex gap-0.5 mb-1">
                    {[1,2,3,4,5].map(s => (
                      <span key={s}
                        className={`text-xl ${s <= filledStars
                          ? 'text-amber-400' : 'text-gray-200'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1
                    rounded-full ${sentiment.bg} ${sentiment.color}`}>
                    {sentiment.label}
                  </span>
                </div>
              </div>

              <div className="w-full max-w-full overflow-x-hidden sm:overflow-visible h-[220px] sm:h-[250px] pt-4">
                <div className="w-[100%] min-w-[280px] h-full px-2 sm:px-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dist} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3"
                        stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="name"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false} tickLine={false} width={24} />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      fontSize: '13px'
                    }}
                  />
                  <Bar dataKey="count" radius={[6,6,0,0]}>
                    {dist.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
                </div>
              </div>
            </div>
          );
        })()}

        {viewMode === 'raw' && question.type === 'rating' && (() => {
          const { avg, avgDisplay, dist, sentiment } = getRatingData(question, filteredResponses);
          const filledStars = Math.round(avg);
          const maxCount = Math.max(...dist.map(d => d.count), 1);

          return (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 p-4 sm:p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="text-left sm:text-center">
                  <p className="text-3xl sm:text-4xl font-bold text-gray-900 leading-none">
                    {avgDisplay}
                  </p>
                  <p className="text-[10px] sm:text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-1 sm:mt-1.5">
                    Average
                  </p>
                </div>
                <div className="flex-1">
                  <div className="flex gap-1 mb-1.5">
                    {[1,2,3,4,5].map(s => (
                      <span key={s}
                        className={`text-xl leading-none ${s <= filledStars ? 'text-amber-400' : 'text-gray-200'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span className={`inline-flex items-center text-xs font-semibold px-2 py-1 rounded-md ${sentiment.bg} ${sentiment.color}`}>
                    {sentiment.label}
                  </span>
                </div>
              </div>

              <div className="space-y-3 px-1">
                {[...dist].reverse().map(({ name, count }) => {
                  const widthPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  const isZero = count === 0;
                  
                  return (
                    <div key={name} className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 group transition-opacity duration-300 ${isZero ? 'opacity-50' : 'opacity-100 hover:opacity-90'}`}>
                      <div className="w-full sm:w-10 shrink-0 flex items-center justify-start sm:justify-end gap-1">
                        <span className="text-sm font-medium text-gray-700">{name.replace('★', '')}</span>
                        <span className="text-amber-400 text-sm">★</span>
                        
                        <span className={`sm:hidden ml-auto text-sm ${isZero ? 'text-gray-400' : 'font-semibold text-gray-900'}`}>
                          {count}
                        </span>
                      </div>
                      
                      <div className="w-full sm:flex-grow flex items-center h-5 sm:border-l sm:border-gray-100 sm:pl-4">
                        <div 
                          className={`h-full rounded-sm transition-all duration-700 ease-out ${
                            isZero ? 'bg-transparent' : 'bg-purple-500 shadow-sm'
                          }`}
                          style={{ 
                            width: isZero ? '0%' : `${widthPct}%`, 
                            minWidth: isZero ? '0' : '4px' 
                          }}
                        />
                      </div>

                      <div className="hidden sm:block w-8 shrink-0 text-right">
                        <span className={`text-sm ${isZero ? 'text-gray-400' : 'font-semibold text-gray-900'}`}>
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* TEXT RENDER */}
        {viewMode === 'chart' && (question.type === 'text' || question.type === 'text_short' || question.type === 'text_long') && (() => {
          const { aggregated, keywords, sentiment, total } =
            getTextAggregation(question, filteredResponses);

          if (total === 0) return (
            <p className="text-sm text-gray-400 italic text-center py-8">
              No answers yet
            </p>
          );

          return (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-medium px-2.5 py-1
                  rounded-full ${sentiment.bg} ${sentiment.color}`}>
                  {sentiment.label}
                </span>
                {keywords.slice(0, 5).map(({ word, count }) => (
                  <span key={word}
                    className="inline-flex items-center gap-1 px-2.5 py-1
                      bg-indigo-50 border border-indigo-100
                      text-indigo-700 rounded-full text-xs font-medium">
                    {word}
                    <span className="text-indigo-400 text-[10px] font-bold">
                      ×{count}
                    </span>
                  </span>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest
                  text-gray-400 mb-2">Top responses</p>
                <div className="space-y-1.5">
                  {aggregated.slice(0, 8).map(({ display, count }, i) => (
                    <div key={i}
                      className="flex items-center justify-between
                        px-3 py-2 bg-gray-50 rounded-xl
                        border border-gray-100">
                      <span className="text-sm text-gray-700 flex-1 truncate
                        mr-3">
                        {display}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {count} response{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {viewMode === 'raw' && (question.type === 'text' || question.type === 'text_short' || question.type === 'text_long') && (() => {
          const answers = filteredResponses
            .map(r => r.answers?.find(a => a.question_id === question.id)
              ?.answer_value)
            .filter(Boolean)
            .slice(0, 20);

          return answers.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-8">
              No answers yet
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {answers.map((ans, i) => (
                <div key={i}
                  className="text-sm text-gray-700 bg-gray-50 rounded-xl
                    px-4 py-2.5 border border-gray-100 break-words whitespace-pre-wrap">
                  {ans}
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
