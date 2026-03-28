/**
 * exportResultsToCSV - Fetches individual responses via API and downloads as CSV.
 *
 * @param {string} surveyId - The survey UUID
 * @param {string} surveyTitle - Used for the filename
 * @param {Function} getResponsesFn - Async function(surveyId) => { survey, questions, responses }
 */
export async function exportResultsToCSV(surveyId, surveyTitle, getResponsesFn) {
  try {
    const { survey, questions, responses } = await getResponsesFn(surveyId);

    if (!responses || responses.length === 0) {
      alert('No responses to export yet.');
      return;
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      alert('No questions found for this survey.');
      return;
    }

    // Build CSV headers using question label (fallback to text or id)
    const headers = [
      'Response ID',
      'Submitted At',
      'Quality',
      'Quality Score',
      'Completion Time (ms)',
      ...questions.map(q => q.label || q.text || `Question ${q.id}`),
    ];

    const rows = responses.map(r => {
      // Build a map of question_id → answer_value for fast lookup
      const answerMap = {};
      if (Array.isArray(r.answers)) {
        r.answers.forEach(a => {
          answerMap[String(a.question_id)] = a.answer_value || '';
        });
      }

      return [
        r.id,
        r.submitted_at,
        r.quality_label || 'good',
        r.quality_score ?? 100,
        r.completion_time_ms || '',
        ...questions.map(q => answerMap[String(q.id)] || ''),
      ];
    });

    // Proper CSV cell escaping per RFC 4180
    const escape = (val) => {
      const str = String(val === null || val === undefined ? '' : val);
      return '"' + str.replace(/"/g, '""') + '"';
    };

    const csvContent = [
      headers.map(escape).join(','),
      ...rows.map(row => row.map(escape).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    const safeName = (surveyTitle || 'survey').replace(/[^a-z0-9]/gi, '-').toLowerCase();
    link.href = url;
    link.download = `${safeName}-results-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Export failed:', err);
    alert('Export failed: ' + (err?.message || 'Unknown error'));
  }
}
