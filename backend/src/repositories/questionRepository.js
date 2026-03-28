const db = require('../../database');

/**
 * Parse a question row from the DB: deserialise JSON options & logic_rules.
 */
function parseRow(row) {
  if (!row) return null;
  return {
    ...row,
    options:     row.options     ? JSON.parse(row.options)     : null,
    logic_rules: row.logic_rules ? JSON.parse(row.logic_rules) : null,
  };
}

function findBySurveyId(surveyId) {
  return db
    .prepare('SELECT * FROM questions WHERE survey_id = ? ORDER BY order_index ASC')
    .all(surveyId)
    .map(parseRow);
}

function findById(id) {
  return parseRow(db.prepare('SELECT * FROM questions WHERE id = ?').get(id));
}

function create({ id, surveyId, type, label, options, required, orderIndex, logicRules }) {
  // options comes in as an array — serialise to JSON string for storage
  const optionsStr = Array.isArray(options) ? JSON.stringify(options) :
                     (options !== null && options !== undefined ? String(options) : null);
  const logicStr   = logicRules ? (typeof logicRules === 'string' ? logicRules : JSON.stringify(logicRules)) : null;

  db.prepare(`
    INSERT INTO questions (id, survey_id, type, label, options, required, order_index, logic_rules)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, surveyId, type, label, optionsStr, required ? 1 : 0, orderIndex ?? 0, logicStr);

  return findById(id);
}

function update(id, { type, label, options, required, order_index }) {
  const optionsStr = Array.isArray(options) ? JSON.stringify(options) :
                     (options !== null && options !== undefined ? String(options) : null);

  db.prepare(`
    UPDATE questions
    SET type = ?, label = ?, options = ?, required = ?, order_index = ?,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
    WHERE id = ?
  `).run(type, label, optionsStr, required ? 1 : 0, order_index, id);

  return findById(id);
}

function updateLogicRules(id, logicRules) {
  const logicStr = logicRules
    ? (typeof logicRules === 'string' ? logicRules : JSON.stringify(logicRules))
    : null;

  db.prepare(`
    UPDATE questions SET logic_rules = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
    WHERE id = ?
  `).run(logicStr, id);

  return findById(id);
}

function remove(id) {
  return db.prepare('DELETE FROM questions WHERE id = ?').run(id);
}

function removeBySurveyId(surveyId) {
  return db.prepare('DELETE FROM questions WHERE survey_id = ?').run(surveyId);
}

function getMaxOrderIndex(surveyId) {
  const row = db.prepare('SELECT MAX(order_index) AS max_idx FROM questions WHERE survey_id = ?').get(surveyId);
  return row.max_idx ?? -1;
}

module.exports = {
  findBySurveyId,
  findById,
  create,
  update,
  updateLogicRules,
  remove,
  removeBySurveyId,
  getMaxOrderIndex,
};
