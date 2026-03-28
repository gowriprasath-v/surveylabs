function scoreResponse(answers, completionTimeMs, questions) {
  const flags = [];
  let score = 100;

  if (completionTimeMs && completionTimeMs < 8000) {
    flags.push({ type: 'too_fast', severity: 'high', detail: `Completed in ${(completionTimeMs / 1000).toFixed(1)}s` });
    score -= 40;
  }

  const questionMap = {};
  if (questions) {
    questions.forEach((q) => {
      questionMap[q.id] = q;
    });
  }

  const ratingAnswers = answers
    .filter((a) => {
      const q = questionMap[a.question_id];
      return q && q.type === 'rating';
    })
    .map((a) => a.answer_value);

  if (ratingAnswers.length >= 3 && new Set(ratingAnswers).size === 1) {
    flags.push({ type: 'straight_line', severity: 'medium', detail: 'All rating answers identical' });
    score -= 30;
  }

  const mcqAnswers = answers
    .filter((a) => {
      const q = questionMap[a.question_id];
      return q && q.type === 'mcq';
    })
    .map((a) => a.answer_value);

  if (mcqAnswers.length >= 3 && new Set(mcqAnswers).size === 1) {
    flags.push({ type: 'straight_line', severity: 'medium', detail: 'All MCQ answers identical' });
    score -= 25;
  }

  const textAnswers = answers.filter((a) => {
    const q = questionMap[a.question_id];
    return q && (q.type === 'text_short' || q.type === 'text_long') && a.answer_value;
  });

  for (const a of textAnswers) {
    const val = a.answer_value;
    const hasVowel = /[aeiouy]/i.test(val);
    const wordCount = val.trim().split(/\s+/).length;
    const tooShort = wordCount < 2;
    // user explicitly requested "asdfgh" to be flagged as gibberish
    const isMashing = /asdf|qwer|zxcv/i.test(val) || /^[^aeiouy]+$/i.test(val);

    if (!hasVowel || isMashing || (tooShort && val.length < 5)) {
      flags.push({ type: 'gibberish', severity: 'medium', question_id: a.question_id, detail: `Suspect text: "${val.substring(0, 30)}"` });
      score -= 20;
    }
  }

  const totalQuestions = questions ? questions.length : answers.length;
  const answeredCount = answers.filter((a) => a.answer_value && String(a.answer_value).trim() !== '').length;
  const skippedRatio = totalQuestions > 0 ? (totalQuestions - answeredCount) / totalQuestions : 0;

  if (skippedRatio > 0.7 && totalQuestions > 3) {
    flags.push({ type: 'mostly_skipped', severity: 'low', detail: `${Math.round(skippedRatio * 100)}% of questions skipped` });
    score -= 15;
  }

  score = Math.max(0, Math.min(100, score));
  const quality = score >= 70 ? 'good' : score >= 40 ? 'suspect' : 'spam';

  return { score, flags, quality };
}

module.exports = { scoreResponse };
