const db = require('../../database');

function create({ id, surveyId, respondentIp, qualityScore, qualityFlags, qualityLabel, completionTimeMs }) {
  db.prepare(`
    INSERT INTO responses (id, survey_id, respondent_ip, quality_score, quality_flags, quality_label, completion_time_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, surveyId, respondentIp, qualityScore || 100, qualityFlags || '[]', qualityLabel || 'good', completionTimeMs || null);
  return db.prepare('SELECT * FROM responses WHERE id = ?').get(id);
}

function countBySurveyId(surveyId) {
  const row = db.prepare('SELECT COUNT(*) as count FROM responses WHERE survey_id = ?').get(surveyId);
  return row.count;
}

function countLastHour(surveyId) {
  const row = db.prepare(`SELECT COUNT(*) as c FROM responses WHERE survey_id = ? AND submitted_at > datetime('now', '-1 hour')`).get(surveyId);
  return row.c;
}

function countPrevHour(surveyId) {
  const row = db.prepare(`SELECT COUNT(*) as c FROM responses WHERE survey_id = ? AND submitted_at BETWEEN datetime('now', '-2 hours') AND datetime('now', '-1 hour')`).get(surveyId);
  return row.c;
}

function countLast24h(surveyId) {
  const row = db.prepare(`SELECT COUNT(*) as c FROM responses WHERE survey_id = ? AND submitted_at > datetime('now', '-24 hours')`).get(surveyId);
  return row.c;
}

function getLastResponseTime(surveyId) {
  const row = db.prepare('SELECT MAX(submitted_at) as last_at FROM responses WHERE survey_id = ?').get(surveyId);
  return row.last_at || null;
}

function getRecentTextAnswers(surveyId, limit) {
  return db.prepare(`
    SELECT a.answer_value as answer, q.label as question, r.submitted_at
    FROM answers a
    JOIN responses r ON r.id = a.response_id
    JOIN questions q ON q.id = a.question_id
    WHERE r.survey_id = ? AND q.type IN ('text_short', 'text_long')
    ORDER BY r.submitted_at DESC
    LIMIT ?
  `).all(surveyId, limit || 5);
}

function findAllBySurveyId(surveyId) {
  return db.prepare('SELECT * FROM responses WHERE survey_id = ? ORDER BY submitted_at DESC').all(surveyId);
}

module.exports = { create, countBySurveyId, countLastHour, countPrevHour, countLast24h, getLastResponseTime, getRecentTextAnswers, findAllBySurveyId };
