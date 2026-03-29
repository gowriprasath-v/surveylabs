// NEW
const STOPWORDS = new Set([
  'the','a','an','is','it','in','on','at','to','for','of','and','or',
  'i','we','my','our','this','that','was','are','be','been','have',
  'has','do','did','not','but','so','if','as','by','with','very',
  'just','really','also','would','could','should','more','some',
  'what','when','how','there','they','them','get','can','will'
]);

export const extractKeywords = (answers, topN = 10) => {
  const freq = {};
  answers.forEach(answer => {
    if (!answer || typeof answer !== 'string') return;
    answer
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length >= 4 && !STOPWORDS.has(w))
      .forEach(word => { freq[word] = (freq[word] || 0) + 1; });
  });
  return Object.entries(freq)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }));
};

// ── STEP 8: RESPONSE QUALITY SCORING ──
export const scoreResponseQuality = (response, questions) => {
  let score = 0;
  const answers = response.answers || [];
  const textAnswers = answers.filter(a => {
    const q = questions.find(q => q.id === a.question_id);
    return q?.type === 'text' && typeof a.answer_value === 'string';
  });

  // Empty or null answers (majority)
  const emptyCount = answers.filter(a =>
    !a.answer_value || String(a.answer_value).trim() === ''
  ).length;
  if (answers.length > 0 && emptyCount / answers.length >= 0.7) score += 3;

  // Very short text answers
  const shortCount = textAnswers.filter(a =>
    a.answer_value.trim().length < 3
  ).length;
  if (shortCount > 0) score += 2;

  // Straight-lining (all same answer across 3+ questions)
  const values = answers
    .map(a => String(a.answer_value || '').trim().toLowerCase())
    .filter(v => v.length > 0);
  if (values.length >= 3 && new Set(values).size === 1) score += 2;

  // Gibberish (no vowels, longer than 4 chars)
  const gibberishCount = textAnswers.filter(a => {
    const v = a.answer_value.trim();
    return v.length > 4 && !/[aeiou]/i.test(v);
  }).length;
  if (gibberishCount > 0) score += 2;

  return {
    score,
    quality: score >= 4 ? 'spam' : score >= 2 ? 'suspect' : 'good'
  };
};

// ── STEP 7: INSIGHTS ENGINE (SCORING SYSTEM) ──
export const generateInsights = (surveyData, responses) => {
  const totalResponses = responses?.length ?? 0;
  if (!surveyData?.questions || totalResponses === 0) return [];
  const insights = [];

  surveyData.questions.forEach(question => {
    if (!question) return;

    if (question.type === 'mcq') {
      const counts = {};
      (question.options || []).forEach(o => { counts[o] = 0; });
      responses.forEach(r => {
        const ans = r.answers?.find(a => a.question_id === question.id);
        if (ans?.answer_value) {
          counts[ans.answer_value] = (counts[ans.answer_value] || 0) + 1;
        }
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (sorted.length === 0) return;
      const [topOption, topCount] = sorted[0];
      const topPct = Math.round((topCount / totalResponses) * 100);

      insights.push({
        type: topPct > 60 ? 'consensus' : 'divided',
        color: topPct > 60 ? 'green' : topPct > 40 ? 'blue' : 'amber',
        question: question.text || question.label,
        text: topPct > 60
          ? `Strong consensus — ${topPct}% chose "${topOption}"`
          : `No clear winner — "${topOption}" leads at ${topPct}%`
      });
    }

    if (question.type === 'rating') {
      const nums = responses
        .map(r => parseInt(
          r.answers?.find(a => a.question_id === question.id)?.answer_value
        ))
        .filter(n => n >= 1 && n <= 5);
      if (nums.length === 0) return;
      const avg = nums.reduce((s, v) => s + v, 0) / nums.length;
      const label = avg >= 4 ? 'Positive' : avg >= 3 ? 'Mixed' : 'Negative';
      const color = avg >= 4 ? 'green' : avg >= 3 ? 'amber' : 'red';
      insights.push({
        type: 'rating', color, question: question.text || question.label,
        text: `Average rating ${avg.toFixed(1)}/5 — ${label} sentiment`
      });
    }

    if (question.type === 'text' || question.type === 'text_short' || question.type === 'text_long') {
      const answers = responses
        .map(r => r.answers?.find(a => a.question_id === question.id)
          ?.answer_value)
        .filter(Boolean);
      const keywords = extractKeywords(answers, 3);
      if (keywords.length >= 1) {
        insights.push({
          type: 'keywords', color: 'blue', question: question.text || question.label,
          text: `Top theme: "${keywords[0].word}" mentioned ${keywords[0].count} times`
        });
      }
    }
  });
  return insights;
};
