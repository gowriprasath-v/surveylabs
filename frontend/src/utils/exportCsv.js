/**
 * exportResponsesCSV - Fetches or receives individual responses and downloads as CSV.
 */
// UPDATED
export const exportResponsesCSV = (surveyId, surveyTitle, responses, questions) => {
  if (!responses || responses.length === 0) {
    alert('No responses to export.');
    return;
  }

  const escape = (val) => {
    const str = String(val === null || val === undefined ? '' : val);
    return '"' + str.replace(/"/g, '""') + '"';
  };

  // Build headers
  const headers = [
    'response_id',
    'submitted_at',
    'quality',
    'quality_score',
    ...questions.map(q => q.text)
  ];

  // Build one row per response
  const rows = responses.map(r => {
    const answerMap = {};
    (r.answers || []).forEach(a => {
      answerMap[a.question_id] = a.answer_value ?? '';
    });
    return [
      r.id,
      r.submitted_at ?? r.created_at ?? '',
      r.quality ?? r.quality_label ?? 'good',
      r.quality_score ?? '',
      ...questions.map(q => answerMap[q.id] ?? '')
    ];
  });

  const csvContent = [
    headers.map(escape).join(','),
    ...rows.map(row => row.map(escape).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  const safeName = (surveyTitle || 'survey')
    .replace(/[^a-z0-9]/gi, '-').toLowerCase();
  link.href = url;
  link.download = `${safeName}-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
