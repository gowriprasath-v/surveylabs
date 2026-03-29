const db = require('../../database');

function createMany(answersArray) {
  const insert = db.prepare(`
    INSERT INTO answers (id, response_id, question_id, answer_value)
    VALUES (?, ?, ?, ?)
  `);

  const transaction = db.transaction((answers) => {
    for (const a of answers) {
      insert.run(a.id, a.response_id, a.question_id, a.answer_value);
    }
  });

  transaction(answersArray);
}

function findByQuestionId(questionId) {
  return db.prepare('SELECT answer_value FROM answers WHERE question_id = ?').all(questionId);
}

module.exports = { createMany, findByQuestionId };
