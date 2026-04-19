// ─────────────────────────────────────────────
//  SurveyLabs Insight Engine  v2.0
//  Core analytics brain for the Results page
// ─────────────────────────────────────────────

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'it', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or',
  'i', 'we', 'my', 'our', 'this', 'that', 'was', 'are', 'be', 'been', 'have',
  'has', 'do', 'did', 'not', 'but', 'so', 'if', 'as', 'by', 'with', 'very',
  'just', 'really', 'also', 'would', 'could', 'should', 'more', 'some',
  'what', 'when', 'how', 'there', 'they', 'them', 'get', 'can', 'will',
  'good', 'great', 'bad', 'nice', 'okay', 'ok', 'yes', 'no', 'its', 'their',
  'your', 'about', 'from', 'into', 'which', 'who', 'than', 'then', 'now',
]);

const POSITIVE_WORDS = new Set([
  'good', 'great', 'excellent', 'nice', 'awesome', 'love', 'perfect', 'fast',
  'speed', 'clean', 'happy', 'amazing', 'best', 'fantastic', 'wonderful',
  'smooth', 'easy', 'helpful', 'useful', 'intuitive', 'clear', 'simple',
  'reliable', 'efficient', 'responsive', 'delightful', 'impressive',
  'outstanding', 'superb', 'flawless', 'brilliant', 'recommend',
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'poor', 'worst', 'slow', 'hard', 'difficult', 'terrible', 'awful',
  'hate', 'confusing', 'frustrating', 'broken', 'buggy', 'crash', 'error',
  'ugly', 'annoying', 'useless', 'complicated', 'boring', 'laggy', 'unclear',
  'disappointing', 'unreliable', 'ignored', 'failed', 'missing', 'wrong',
  'inconsistent', 'messy', 'overwhelming', 'lacking', 'mediocre',
]);

// ── TEXT UTILITIES ───────────────────────────

export const cleanData = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
};

export const extractKeywords = (answers, topN = 10, minCount = 1) => {
  const freq = {};
  answers.forEach(answer => {
    const cleaned = cleanData(answer);
    if (!cleaned) return;
    cleaned.split(/\s+/)
      .filter(w => w.length >= 3 && w !== 'undefined' && !STOPWORDS.has(w))
      .forEach(word => { freq[word] = (freq[word] || 0) + 1; });
  });
  return Object.entries(freq)
    .filter(([, count]) => count >= Math.max(1, minCount))
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }));
};

export const detectSentiment = (answers) => {
  let pos = 0; let neg = 0;
  answers.forEach(answer => {
    const words = cleanData(answer).split(/\s+/);
    words.forEach(w => {
      if (POSITIVE_WORDS.has(w)) pos++;
      if (NEGATIVE_WORDS.has(w)) neg++;
    });
  });
  if (pos === 0 && neg === 0) return 'Neutral';
  if (pos > neg * 2) return 'Positive';
  if (neg > pos * 2) return 'Negative';
  return 'Mixed';
};

// ── QUALITY SCORING ──────────────────────────

export const scoreResponseQuality = (response, questions, settings = { minTextLength: 3, duplicateFilter: true }) => {
  const answers = response.answers || [];
  if (answers.length === 0) return { score: 4, quality: 'spam' };

  const emptyCount = answers.filter(a => !a.answer_value || String(a.answer_value).trim() === '').length;
  if (emptyCount === answers.length) return { score: 4, quality: 'spam' };

  if (settings.duplicateFilter) {
    const values = answers.map(a => String(a.answer_value || '').trim().toLowerCase()).filter(v => v.length > 0);
    if (values.length >= 3 && new Set(values).size === 1) return { score: 2, quality: 'suspect' };
  }

  const textAnswers = answers.filter(a => {
    const q = questions.find(q => q.id === a.question_id);
    return (q?.type === 'text' || q?.type === 'text_short' || q?.type === 'text_long') && typeof a.answer_value === 'string';
  });

  for (const ta of textAnswers) {
    const val = ta.answer_value.trim();
    if (val.length < settings.minTextLength) return { score: 2, quality: 'suspect' };
    if (val.length >= 4 && !/[aeiouy]/i.test(val)) return { score: 3, quality: 'suspect' };
  }

  return { score: 0, quality: 'good' };
};

// ── HELPERS ──────────────────────────────────

const pickExamples = (arr, max = 2) => {
  const cleaned = (arr || [])
    .map(v => String(v || '').trim())
    .filter(v => v.length >= 5 && v.length <= 200)
    .filter(v => /[aeiouy]/i.test(v))
    .filter(v => !/(asdf|qwer|zxcv|test|lorem)/i.test(v));
  const uniq = [];
  const seen = new Set();
  for (const v of cleaned) {
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(v);
    if (uniq.length >= max) break;
  }
  return uniq;
};

const truncate = (str, max = 40) =>
  str && str.length > max ? str.slice(0, max).trimEnd() + '…' : str;

// ── MAIN ENGINE ──────────────────────────────

/**
 * generateInsights(surveyData, responses)
 *
 * Returns an array of insight objects:
 * {
 *   type:     string   — 'confidence' | 'engagement' | 'consensus' | 'rating' | 'distribution' |
 *                         'dropout' | 'speed' | 'keywords' | 'sentiment' | 'evidence'
 *   color:    string   — 'emerald' | 'amber' | 'red' | 'indigo'
 *   severity: string   — 'good' | 'warn' | 'alert'
 *   question: string   — question title or global label
 *   text:     string   — human-readable insight sentence
 *   value:    any      — optional raw value for UI rendering (avg, pct, etc.)
 * }
 */
export const generateInsights = (surveyData, responses) => {
  const totalResponses = responses?.length ?? 0;
  if (!surveyData?.questions || surveyData.questions.length === 0) return [];
  const insights = [];
  const questions = surveyData.questions;

  // ── 1. DATA CONFIDENCE ──
  const confidenceLevel = totalResponses < 3 ? 'low' : totalResponses < 10 ? 'moderate' : 'high';
  insights.push({
    type: 'confidence',
    color: confidenceLevel === 'high' ? 'emerald' : confidenceLevel === 'moderate' ? 'indigo' : 'amber',
    severity: confidenceLevel === 'high' ? 'good' : confidenceLevel === 'moderate' ? 'warn' : 'warn',
    question: 'Data Confidence',
    text: confidenceLevel === 'high'
      ? `High confidence — ${totalResponses} responses provide reliable patterns`
      : confidenceLevel === 'moderate'
        ? `Moderate confidence — trends will sharpen as more responses arrive (${totalResponses} so far)`
        : `Low confidence — only ${totalResponses} response${totalResponses === 1 ? '' : 's'} recorded`,
    value: totalResponses,
  });

  if (totalResponses === 0) return insights;

  // ── 2. ENGAGEMENT ──
  const engagementLevel = totalResponses >= 20 ? 'high' : totalResponses >= 5 ? 'steady' : 'early';
  insights.push({
    type: 'engagement',
    color: engagementLevel === 'high' ? 'emerald' : 'amber',
    severity: engagementLevel === 'high' ? 'good' : 'warn',
    question: 'Global Engagement',
    text: engagementLevel === 'high'
      ? `Strong engagement — ${totalResponses} responses collected`
      : engagementLevel === 'steady'
        ? `Steady engagement — ${totalResponses} responses collected and growing`
        : `Early data — ${totalResponses} response${totalResponses === 1 ? '' : 's'} so far`,
    value: totalResponses,
  });

  // ── 3. COMPLETION SPEED ──
  const validTimes = responses
    .map(r => r.completion_time_ms)
    .filter(t => typeof t === 'number' && t > 0);

  if (validTimes.length >= 2) {
    const avgMs = validTimes.reduce((s, v) => s + v, 0) / validTimes.length;
    const avgSec = Math.round(avgMs / 1000);
    const formatted = avgSec >= 60
      ? `${Math.floor(avgSec / 60)}m ${avgSec % 60}s`
      : `${avgSec}s`;

    let speedText, speedColor, speedSeverity;
    if (avgSec < 10) {
      speedText = `Very fast avg completion (${formatted}) — possible rushed responses`;
      speedColor = 'amber'; speedSeverity = 'warn';
    } else if (avgSec < 30) {
      speedText = `Quick avg completion at ${formatted} — responses appear genuine`;
      speedColor = 'emerald'; speedSeverity = 'good';
    } else if (avgSec < 120) {
      speedText = `Thoughtful avg completion at ${formatted} — high engagement`;
      speedColor = 'emerald'; speedSeverity = 'good';
    } else {
      speedText = `Slow avg completion (${formatted}) — survey may be too long`;
      speedColor = 'amber'; speedSeverity = 'warn';
    }

    insights.push({
      type: 'speed',
      color: speedColor,
      severity: speedSeverity,
      question: 'Completion Speed',
      text: speedText,
      value: avgSec,
    });
  }

  // ── 4. DROPOUT DETECTION ──
  questions.forEach(question => {
    if (!question) return;
    const answered = responses.filter(r =>
      r.answers?.some(a => a.question_id === question.id && a.answer_value != null && String(a.answer_value).trim() !== '')
    ).length;

    if (totalResponses >= 3 && answered < totalResponses) {
      const dropPct = Math.round(((totalResponses - answered) / totalResponses) * 100);
      if (dropPct >= 20) {
        insights.push({
          type: 'dropout',
          color: dropPct >= 50 ? 'red' : 'amber',
          severity: dropPct >= 50 ? 'alert' : 'warn',
          question: truncate(question.text || `Question ${question.id}`, 45),
          text: `${dropPct}% of respondents skipped this question (${totalResponses - answered} of ${totalResponses})`,
          value: dropPct,
        });
      }
    }
  });

  // ── 5. PER-QUESTION ANALYSIS ──
  questions.forEach(question => {
    if (!question) return;
    const qTitle = truncate(question.text || `Question ${question.id}`, 45);

    // MCQ ───────────────────────────────────
    if (question.type === 'mcq') {
      const counts = {};
      (question.options || []).forEach(o => { counts[o] = 0; });
      responses.forEach(r => {
        const ans = r.answers?.find(a => a.question_id === question.id);
        if (ans?.answer_value) counts[ans.answer_value] = (counts[ans.answer_value] || 0) + 1;
      });

      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (sorted.length === 0) return;

      const [topOption, topCount] = sorted[0];
      const topPct = Math.round((topCount / totalResponses) * 100);
      const second = sorted[1] || null;
      const secondPct = second ? Math.round((second[1] / totalResponses) * 100) : 0;

      let text, color, severity;
      if (topPct > 70) {
        text = `Strong consensus — ${topPct}% chose "${topOption}"`;
        color = 'emerald'; severity = 'good';
      } else if (topPct >= 45) {
        text = `"${topOption}" leads at ${topPct}%` + (second ? `, followed by "${second[0]}" at ${secondPct}%` : '');
        color = 'indigo'; severity = 'good';
      } else {
        text = second
          ? `Split decision — "${topOption}" (${topPct}%) vs "${second[0]}" (${secondPct}%)`
          : 'No clear winner — responses are evenly distributed';
        color = 'amber'; severity = 'warn';
      }

      insights.push({
        type: 'consensus',
        color, severity, question: qTitle, text,
        value: { topOption, topPct, all: sorted.slice(0, 3).map(([opt, cnt]) => ({ opt, pct: Math.round((cnt / totalResponses) * 100) })) },
      });
    }

    // RATING ────────────────────────────────
    if (question.type === 'rating') {
      const nums = responses
        .map(r => parseInt(r.answers?.find(a => a.question_id === question.id)?.answer_value))
        .filter(n => n >= 1 && n <= 5);

      if (nums.length === 0) return;

      const avg = nums.reduce((s, v) => s + v, 0) / nums.length;
      const topScorePct = Math.round((nums.filter(n => n >= 4).length / nums.length) * 100);
      const botScorePct = Math.round((nums.filter(n => n <= 2).length / nums.length) * 100);

      // Distribution breakdown
      const dist = [1, 2, 3, 4, 5].map(star => ({
        star,
        count: nums.filter(n => n === star).length,
        pct: Math.round((nums.filter(n => n === star).length / nums.length) * 100),
      }));

      let text, color, severity;
      if (avg >= 4.2) {
        text = `Excellent — avg ${avg.toFixed(1)}/5, ${topScorePct}% rated 4+ stars`;
        color = 'emerald'; severity = 'good';
      } else if (avg >= 3.0) {
        text = `Mixed — avg ${avg.toFixed(1)}/5 (${topScorePct}% positive, ${botScorePct}% negative)`;
        color = 'amber'; severity = 'warn';
      } else {
        text = `Low satisfaction — avg ${avg.toFixed(1)}/5, ${botScorePct}% gave 1–2 stars`;
        color = 'red'; severity = 'alert';
      }

      insights.push({
        type: 'rating',
        color, severity, question: qTitle, text,
        value: { avg: avg.toFixed(1), dist, topScorePct, botScorePct },
      });
    }

    // TEXT ──────────────────────────────────
    if (question.type === 'text' || question.type === 'text_short' || question.type === 'text_long') {
      const answers = responses
        .map(r => r.answers?.find(a => a.question_id === question.id)?.answer_value)
        .filter(Boolean);

      if (answers.length === 0) return;

      const minCount = totalResponses >= 5 ? 2 : 1;
      const keywords = extractKeywords(answers, 6, minCount);
      const sentiment = detectSentiment(answers);

      if (keywords.length >= 1) {
        const pieces = keywords.slice(0, 3).map(k => k.word);
        const themeText = pieces.length >= 2
          ? `Recurring themes: "${pieces.join('", "')}" mentioned most`
          : `Top theme: "${pieces[0]}" appears across responses`;
        insights.push({
          type: 'keywords',
          color: 'indigo', severity: 'good',
          question: qTitle, text: themeText,
          value: keywords.slice(0, 5),
        });
      }

      if (sentiment !== 'Neutral') {
        const sColor = sentiment === 'Positive' ? 'emerald' : sentiment === 'Negative' ? 'red' : 'amber';
        const severity = sentiment === 'Negative' ? 'alert' : 'warn';
        const sText = sentiment === 'Mixed'
          ? 'Feedback is mixed — positive notes alongside concerns'
          : sentiment === 'Positive'
            ? 'Overall positive sentiment across written responses'
            : 'Negative sentiment detected — responses highlight friction';
        insights.push({
          type: 'sentiment', color: sColor, severity,
          question: qTitle, text: sText,
          value: sentiment,
        });
      }

      const examples = pickExamples(answers, 2);
      if (examples.length > 0 && totalResponses >= 2) {
        insights.push({
          type: 'evidence',
          color: 'indigo', severity: 'good',
          question: qTitle,
          text: examples.length > 1
            ? `Responses: "${examples[0]}" · "${examples[1]}"`
            : `Response: "${examples[0]}"`,
          value: examples,
        });
      }
    }
  });

  return insights;
};
