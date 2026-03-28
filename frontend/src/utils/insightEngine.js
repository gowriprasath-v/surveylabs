export function generateInsights(surveyData) {
  const insights = [];

  if (!surveyData || !Array.isArray(surveyData.questions)) return insights;

  for (const q of surveyData.questions) {
    if (!q || !q.results) continue; // never crash if no results

    const totalAnswers = q.total_answers || 0;
    if (totalAnswers === 0) continue;

    if (q.type === 'mcq' && Array.isArray(q.options) && typeof q.results === 'object') {
      const sorted = Object.entries(q.results).sort((a, b) => (b[1] || 0) - (a[1] || 0));
      if (sorted.length === 0 || !sorted[0] || (sorted[0][1] || 0) === 0) continue;

      const [topAnswer, topCount] = sorted[0];
      const total = sorted.reduce((s, [, c]) => s + (Number(c) || 0), 0);
      if (total === 0) continue;
      
      const pct = Math.round((topCount / total) * 100);

      if (pct >= 60) {
        insights.push({
          type: 'majority',
          icon: '◆',
          text: `${pct}% chose "${topAnswer}" for "${q.label || 'question'}" — a clear majority.`,
          strength: pct >= 80 ? 'strong' : 'moderate',
        });
      }

      const values = Object.values(q.results).map(v => Number(v) || 0);
      const sortedValues = [...values].sort((a, b) => b - a);
      if (sortedValues.length >= 2) {
        const v1 = sortedValues[0];
        const v2 = sortedValues[1];
        if (v1 > 0 && v2 > 0 && (v1 - v2) < (total * 0.15)) {
          insights.push({
            type: 'divided',
            icon: '◈',
            text: `Opinions on "${q.label || 'question'}" are split — no clear consensus.`,
            strength: 'moderate',
          });
        }
      }
    }

    if (q.type === 'rating' && typeof q.results === 'object' && 'average' in q.results) {
      const avg = Number(q.results.average) || 0;
      const count = Number(q.results.count) || 0;
      if (avg === 0 && count === 0) continue;
      
      const label = avg >= 4 ? 'excellent' : avg >= 3 ? 'positive' : avg >= 2 ? 'mixed' : 'poor';
      insights.push({
        type: 'rating',
        icon: avg >= 4 ? '▲' : avg < 2 ? '▼' : '●',
        text: `Average rating for "${q.label || 'question'}": ${avg.toFixed(1)}/5 — ${label} sentiment.`,
        strength: (avg >= 4.5 || avg < 1.5) ? 'strong' : 'moderate',
      });
    }

    if ((q.type === 'text_short' || q.type === 'text_long' || q.type === 'text') && Array.isArray(q.results)) {
      const stopwords = new Set([
        'the', 'a', 'an', 'is', 'it', 'in', 'on', 'at', 'to', 'for', 'of',
        'and', 'or', 'i', 'we', 'my', 'our', 'but', 'not', 'with', 'this',
        'that', 'was', 'are', 'be', 'have', 'had', 'has', 'been', 'will',
        'would', 'could', 'should', 'they', 'them', 'their', 'from', 'what',
        'when', 'where', 'which', 'more', 'very', 'just', 'also', 'than',
        'some', 'only', 'really', 'like', 'about', 'your', 'there',
      ]);
      const freq = {};
      
      for (const ans of q.results) {
        if (typeof ans !== 'string') continue;
        const words = ans.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
        for (const word of words) {
          if (!stopwords.has(word)) {
            freq[word] = (freq[word] || 0) + 1;
          }
        }
      }
      
      const top = Object.entries(freq)
        .filter(([, count]) => count >= 2) // must occur at least twice
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([w]) => w);

      if (top.length >= 2) {
        insights.push({
          type: 'keywords',
          icon: '◉',
          text: `Common themes: "${top.join('", "')}" in "${q.label || 'responses'}"`,
          strength: 'moderate',
        });
      }
    }
  }

  // Overall completion rate insight
  if (typeof surveyData.total_responses === 'number' && surveyData.total_responses >= 5) {
    const qualityCounts = surveyData.quality_counts || {};
    const spamCount = qualityCounts.spam || 0;
    const suspectCount = qualityCounts.suspect || 0;
    const total = surveyData.total_responses;
    const badRatio = (spamCount + suspectCount) / total;

    if (badRatio > 0.3) {
      insights.push({
        type: 'warning',
        icon: '⚠',
        text: `${Math.round(badRatio * 100)}% of responses flagged as suspect/spam. Review data quality.`,
        strength: 'strong',
      });
    }
  }

  return insights;
}
