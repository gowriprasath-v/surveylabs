const db = require('../../database');

function findAllByUser(userId) {
  const surveys = db.prepare(`
    SELECT
      surveys.*,
      COUNT(DISTINCT questions.id)  AS question_count,
      COUNT(DISTINCT responses.id)  AS response_count
    FROM surveys
    LEFT JOIN questions  ON questions.survey_id  = surveys.id
    LEFT JOIN responses  ON responses.survey_id  = surveys.id
    WHERE surveys.created_by = ?
    GROUP BY surveys.id
    ORDER BY surveys.created_at DESC
  `).all(userId);

  // Attach 7-day daily response counts (sparkline data) per survey
  const today = new Date();
  return surveys.map(survey => {
    const spark = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const row = db.prepare(`
        SELECT COUNT(*) AS cnt FROM responses
        WHERE survey_id = ?
        AND DATE(submitted_at) = ?
      `).get(survey.id, dateStr);
      spark.push(row ? row.cnt : 0);
    }
    return { ...survey, spark };
  });
}

function findById(id) {
  // Returns null (not throws) when not found
  return db.prepare('SELECT * FROM surveys WHERE id = ?').get(id) || null;
}

function findByIdForOwner(id, userId) {
  return db.prepare('SELECT * FROM surveys WHERE id = ? AND created_by = ?').get(id, userId) || null;
}

function create({ id, title, description, userId, mode }) {
  db.prepare(`
    INSERT INTO surveys (id, title, description, created_by, mode)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, title, description || '', userId, mode || 'standard');
  return findById(id);
}

function update(id, { title, description, is_active, mode }) {
  db.prepare(`
    UPDATE surveys
    SET title = ?, description = ?, is_active = ?, mode = ?,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
    WHERE id = ?
  `).run(title, description, is_active, mode || 'standard', id);
  return findById(id);
}

/**
 * Hard-delete: cascade-delete answers → responses → questions → survey.
 * Relies on SQLite foreign_keys = ON, which is set in database.js.
 * We also do it explicitly to be safe regardless of FK enforcement.
 */
function remove(id) {
  const deleteAll = db.transaction(() => {
    // Delete answers for all responses of this survey
    db.prepare(`
      DELETE FROM answers WHERE response_id IN (
        SELECT id FROM responses WHERE survey_id = ?
      )
    `).run(id);
    // Delete responses
    db.prepare('DELETE FROM responses WHERE survey_id = ?').run(id);
    // Delete answers for questions (in case FK wasn't enforced)
    db.prepare(`
      DELETE FROM answers WHERE question_id IN (
        SELECT id FROM questions WHERE survey_id = ?
      )
    `).run(id);
    // Delete questions
    db.prepare('DELETE FROM questions WHERE survey_id = ?').run(id);
    // Delete survey
    const result = db.prepare('DELETE FROM surveys WHERE id = ?').run(id);
    return result.changes;
  });
  return deleteAll();
}

function getQualityCounts(surveyId) {
  const rows = db.prepare(`
    SELECT quality_label, COUNT(*) AS cnt
    FROM responses WHERE survey_id = ?
    GROUP BY quality_label
  `).all(surveyId);
  const counts = { good: 0, suspect: 0, spam: 0 };
  rows.forEach((r) => { counts[r.quality_label] = r.cnt; });
  return counts;
}

module.exports = {
  findAllByUser,
  findById,
  findByIdForOwner,
  create,
  update,
  remove,
  getQualityCounts,
};
