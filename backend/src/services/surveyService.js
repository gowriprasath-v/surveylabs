const { v4: uuidv4 } = require('uuid');
const db = require('../../database');
const surveyRepository   = require('../repositories/surveyRepository');
const questionRepository = require('../repositories/questionRepository');
const responseRepository = require('../repositories/responseRepository');

// ── Valid enumerations ────────────────────────────────────────────────────────
// The live SQLite CHECK constraint accepts: mcq, text_short, text_long, rating
// We also accept 'text' as a shorthand — normalised to 'text_long' before storage.
const VALID_TYPES  = ['mcq', 'text_short', 'text_long', 'rating', 'text'];
const VALID_MODES  = ['standard', 'conversational'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function createError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

// Normalise 'text' → 'text_long' to satisfy the existing DB CHECK constraint.
function normalizeType(t) {
  if (!t) return 'text_long';
  return t === 'text' ? 'text_long' : t;
}

// ── Read helpers ──────────────────────────────────────────────────────────────

function getAllSurveys(userId) {
  const surveys = surveyRepository.findAllByUser(userId);
  return surveys.map((s) => {
    const qualityCounts = surveyRepository.getQualityCounts(s.id);
    return { ...s, quality_counts: qualityCounts };
  });
}

function getSurveyWithQuestions(surveyId, userId) {
  const survey = surveyRepository.findByIdForOwner(surveyId, userId);
  if (!survey) throw createError('Survey not found', 404);
  const questions = questionRepository.findBySurveyId(surveyId);
  return { survey, questions };
}

function getPublicSurvey(surveyId) {
  const survey = surveyRepository.findById(surveyId);
  if (!survey || !survey.is_active) {
    throw createError('Survey not found or no longer available', 404);
  }
  const questions = questionRepository.findBySurveyId(surveyId);
  return {
    survey: {
      id:          survey.id,
      title:       survey.title,
      description: survey.description,
      mode:        survey.mode || 'standard',
    },
    questions,
  };
}

// ── Survey mutations ──────────────────────────────────────────────────────────

/**
 * Create a survey and (optionally) its questions in a single DB transaction.
 * Body shape:
 *   { title, description, mode, questions: [{ text|label, type, options, required, order_index }] }
 */
function createSurvey(userId, { title, description, mode, questions }) {
  if (!title?.trim()) throw createError('Title is required');

  const surveyMode = VALID_MODES.includes(mode) ? mode : 'standard';
  const surveyId   = uuidv4();

  const runAll = db.transaction(() => {
    // 1. Insert survey shell
    surveyRepository.create({
      id:          surveyId,
      title:       title.trim(),
      description: description?.trim() || '',
      userId,
      mode:        surveyMode,
    });

    // 2. Insert questions if provided
    if (Array.isArray(questions) && questions.length > 0) {
      questions.forEach((q, idx) => {
        const qType  = normalizeType(q.type || 'text_long');
        const qLabel = (q.label || q.text || '').trim();

        if (!VALID_TYPES.includes(qType)) {
          throw createError(`Invalid question type: ${q.type}`);
        }
        if (!qLabel) throw createError(`Question ${idx + 1} requires a label/text`);

        questionRepository.create({
          id:         q.id || uuidv4(),
          surveyId,
          type:       qType,
          label:      qLabel,
          options:    qType === 'mcq' ? (Array.isArray(q.options) ? q.options : []) : null,
          required:   q.required !== false,
          orderIndex: q.order_index ?? idx,
          logicRules: q.logic_rules || null,
        });
      });
    }
  });

  runAll();

  // Return enriched survey with its questions
  const saved          = surveyRepository.findById(surveyId);
  const savedQuestions = questionRepository.findBySurveyId(surveyId);
  return { ...saved, questions: savedQuestions };
}

/**
 * Update survey metadata and atomically replace all questions.
 */
function updateSurvey(surveyId, userId, updates) {
  const survey = surveyRepository.findByIdForOwner(surveyId, userId);
  if (!survey) throw createError('Survey not found', 404);

  const title       = ((updates.title       ?? survey.title) || '').trim();
  const description = ((updates.description ?? survey.description ?? '')).trim();
  const is_active   = updates.is_active ?? survey.is_active;
  const mode        = VALID_MODES.includes(updates.mode) ? updates.mode : (survey.mode || 'standard');

  if (!title) throw createError('Title is required');

  const runAll = db.transaction(() => {
    surveyRepository.update(surveyId, { title, description, is_active, mode });

    if (Array.isArray(updates.questions)) {
      const existingQs = questionRepository.findBySurveyId(surveyId);
      const existingIds = existingQs.map(e => e.id);
      
      const incomingIds = updates.questions.filter(q => q.id).map(q => q.id);
      const toDelete = existingIds.filter(id => !incomingIds.includes(id));
      
      toDelete.forEach(id => questionRepository.remove(id));

      updates.questions.forEach((q, idx) => {
        const qType  = normalizeType(q.type || 'text_long');
        const qLabel = (q.label || q.text || '').trim();

        if (!VALID_TYPES.includes(qType)) throw createError(`Invalid question type: ${q.type}`);
        if (!qLabel) throw createError(`Question ${idx + 1} requires a label/text`);

        const qId = q.id || uuidv4();

        if (existingIds.includes(qId)) {
          questionRepository.update(qId, {
            type:       qType,
            label:      qLabel,
            options:    qType === 'mcq' ? (Array.isArray(q.options) ? q.options : []) : null,
            required:   q.required !== false,
            order_index: q.order_index ?? idx,
          });
          if (q.logic_rules !== undefined) {
             questionRepository.updateLogicRules(qId, q.logic_rules || null);
          }
        } else {
          questionRepository.create({
            id:         qId,
            surveyId,
            type:       qType,
            label:      qLabel,
            options:    qType === 'mcq' ? (Array.isArray(q.options) ? q.options : []) : null,
            required:   q.required !== false,
            orderIndex: q.order_index ?? idx,
            logicRules: q.logic_rules || null,
          });
        }
      });
    }
  });

  runAll();

  const saved          = surveyRepository.findById(surveyId);
  const savedQuestions = questionRepository.findBySurveyId(surveyId);
  return { ...saved, questions: savedQuestions };
}

function deleteSurvey(surveyId, userId) {
  const survey = surveyRepository.findByIdForOwner(surveyId, userId);
  if (!survey) throw createError('Survey not found', 404);
  return surveyRepository.remove(surveyId);
}

// ── Question mutations ────────────────────────────────────────────────────────

function addQuestion(surveyId, userId, { type, label, options, required, order_index, logic_rules }) {
  const survey = surveyRepository.findByIdForOwner(surveyId, userId);
  if (!survey) throw createError('Survey not found', 404);

  const normType = normalizeType(type);
  if (!normType || !VALID_TYPES.includes(normType)) {
    throw createError(`Invalid question type. Must be one of: ${VALID_TYPES.join(', ')}`);
  }
  if (!label?.trim()) throw createError('Question label is required');

  if (normType === 'mcq') {
    if (!Array.isArray(options) || options.length < 2) {
      throw createError('MCQ requires at least 2 options');
    }
  }

  const maxIdx        = questionRepository.getMaxOrderIndex(surveyId);
  const finalOrderIdx = order_index ?? maxIdx + 1;

  return questionRepository.create({
    id:         uuidv4(),
    surveyId,
    type:       normType,
    label:      label.trim(),
    options:    normType === 'mcq' ? options.map((o) => o.trim()) : null,
    required:   required !== false,
    orderIndex: finalOrderIdx,
    logicRules: logic_rules || null,
  });
}

function updateQuestion(surveyId, questionId, userId, updates) {
  const survey = surveyRepository.findByIdForOwner(surveyId, userId);
  if (!survey) throw createError('Survey not found', 404);

  const question = questionRepository.findById(questionId);
  if (!question || question.survey_id !== surveyId) throw createError('Question not found', 404);

  const type       = normalizeType(updates.type || question.type);
  const label      = ((updates.label ?? question.label) || '').trim();
  const required   = updates.required ?? (question.required === 1);
  const order_index = updates.order_index ?? question.order_index;

  if (!VALID_TYPES.includes(type)) throw createError(`Invalid question type`);
  if (!label) throw createError('Question label is required');

  let options = null;
  if (type === 'mcq') {
    options = updates.options || (Array.isArray(question.options) ? question.options : []);
    if (!Array.isArray(options) || options.length < 2) {
      throw createError('MCQ requires at least 2 options');
    }
  }

  questionRepository.update(questionId, { type, label, options, required, order_index });

  if (updates.logic_rules !== undefined) {
    questionRepository.updateLogicRules(questionId, updates.logic_rules);
  }

  return questionRepository.findById(questionId);
}

function updateLogicRules(surveyId, questionId, userId, logicRules) {
  const survey = surveyRepository.findByIdForOwner(surveyId, userId);
  if (!survey) throw createError('Survey not found', 404);

  const question = questionRepository.findById(questionId);
  if (!question || question.survey_id !== surveyId) throw createError('Question not found', 404);

  return questionRepository.updateLogicRules(questionId, logicRules);
}

function deleteQuestion(surveyId, questionId, userId) {
  const survey = surveyRepository.findByIdForOwner(surveyId, userId);
  if (!survey) throw createError('Survey not found', 404);

  const question = questionRepository.findById(questionId);
  if (!question || question.survey_id !== surveyId) throw createError('Question not found', 404);

  questionRepository.remove(questionId);
}

// ── Results ───────────────────────────────────────────────────────────────────

function getResults(surveyId, userId) {
  const { survey, questions } = getSurveyWithQuestions(surveyId, userId);
  const totalResponses = responseRepository.countBySurveyId(surveyId);
  const qualityCounts  = surveyRepository.getQualityCounts(surveyId);

  const questionsWithResults = questions.map((q) => {
    const rawAnswers = db
      .prepare('SELECT answer_value FROM answers WHERE question_id = ?')
      .all(q.id)
      .map((r) => r.answer_value);

    let results;
    const qType = q.type;

    if (qType === 'mcq') {
      const counts = {};
      if (Array.isArray(q.options)) q.options.forEach((o) => { counts[o] = 0; });
      rawAnswers.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
      results = counts;
    } else if (qType === 'rating') {
      const nums   = rawAnswers.map((v) => parseInt(v, 10)).filter((n) => !isNaN(n));
      const count  = nums.length;
      const sum    = nums.reduce((s, n) => s + n, 0);
      const average = count > 0 ? parseFloat((sum / count).toFixed(1)) : 0;
      const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
      nums.forEach((n) => { distribution[String(n)] = (distribution[String(n)] || 0) + 1; });
      results = { average, count, distribution };
    } else {
      results = rawAnswers;
    }

    return {
      id:            q.id,
      label:         q.label,
      text:          q.label,
      type:          q.type,
      options:       q.options,
      required:      q.required,
      total_answers: rawAnswers.length,
      results,
    };
  });

  return {
    survey:          { id: survey.id, title: survey.title, description: survey.description, is_active: survey.is_active },
    total_responses: totalResponses,
    completion_rate: totalResponses,
    quality_counts:  qualityCounts,
    questions:       questionsWithResults,
  };
}

// ── Pulse ─────────────────────────────────────────────────────────────────────

function getPulse(surveyId, userId) {
  const survey = surveyRepository.findByIdForOwner(surveyId, userId);
  if (!survey) throw createError('Survey not found', 404);

  const totalResponses    = responseRepository.countBySurveyId(surveyId);
  const lastHour          = responseRepository.countLastHour(surveyId);
  const prevHour          = responseRepository.countPrevHour(surveyId);
  const last24h           = responseRepository.countLast24h(surveyId);
  const lastResponseAt    = responseRepository.getLastResponseTime(surveyId);
  const recentTextAnswers = responseRepository.getRecentTextAnswers(surveyId, 5);

  let velocity = 'steady';
  if (lastHour > prevHour) velocity = 'accelerating';
  else if (lastHour < prevHour) velocity = 'slowing';

  return {
    total_responses:     totalResponses,
    last_response_at:    lastResponseAt,
    responses_last_hour: lastHour,
    responses_last_24h:  last24h,
    velocity,
    recent_text_answers: recentTextAnswers,
  };
}

// ── Individual Responses (for CSV export) ────────────────────────────────────

function getIndividualResponses(surveyId, userId) {
  const survey = surveyRepository.findByIdForOwner(surveyId, userId);
  if (!survey) throw createError('Survey not found', 404);

  const questions = questionRepository.findBySurveyId(surveyId);
  const responses = responseRepository.findAllBySurveyId(surveyId);

  const result = responses.map((r) => {
    const answers = db
      .prepare('SELECT question_id, answer_value FROM answers WHERE response_id = ?')
      .all(r.id);
    return {
      id: r.id,
      submitted_at: r.submitted_at,
      quality_label: r.quality_label,
      quality_score: r.quality_score,
      completion_time_ms: r.completion_time_ms,
      answers: answers.map(a => ({
        question_id: a.question_id,
        answer_value: a.answer_value,
      })),
    };
  });

  return {
    survey: { id: survey.id, title: survey.title, description: survey.description },
    questions,
    responses: result,
  };
}

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  getAllSurveys,
  getSurveyWithQuestions,
  getPublicSurvey,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  addQuestion,
  updateQuestion,
  updateLogicRules,
  deleteQuestion,
  getResults,
  getIndividualResponses,
  getPulse,
};
