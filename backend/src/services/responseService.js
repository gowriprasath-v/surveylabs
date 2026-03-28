const { v4: uuidv4 } = require('uuid');
const db = require('../../database');
const surveyRepository   = require('../repositories/surveyRepository');
const questionRepository = require('../repositories/questionRepository');
const responseRepository = require('../repositories/responseRepository');
const answerRepository   = require('../repositories/answerRepository');
const { scoreResponse }  = require('./responseQualityService');

function createError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * Submit a survey response inside a single DB transaction.
 * Accepts completionTimeMs from either camelCase or snake_case key.
 */
function submitResponse(surveyId, answersPayload, ip, completionTimeMs) {
  if (!Array.isArray(answersPayload)) {
    throw createError('Answers must be an array');
  }

  const survey = surveyRepository.findById(surveyId);
  if (!survey || !survey.is_active) {
    throw createError('Survey not found or no longer accepting responses', 404);
  }

  const questions = questionRepository.findBySurveyId(surveyId);
  if (questions.length === 0) {
    throw createError('This survey has no questions');
  }

  // Build lookup maps
  const questionMap = {};
  questions.forEach((q) => { questionMap[q.id] = q; });

  const answersMap = {};
  answersPayload.forEach((a) => { answersMap[a.question_id] = a.answer_value; });

  // Validate each submitted answer references a question in this survey
  for (const a of answersPayload) {
    if (!questionMap[a.question_id]) {
      throw createError(`Invalid question reference: ${a.question_id}`);
    }
  }

  // Validate type-specific rules (MCQ options, rating range)
  for (const a of answersPayload) {
    const q   = questionMap[a.question_id];
    const val = a.answer_value;
    if (!q || val === undefined || val === null || String(val).trim() === '') continue;

    if (q.type === 'mcq' && Array.isArray(q.options) && !q.options.includes(val)) {
      throw createError(`Invalid option "${val}" for question "${q.label}"`);
    }

    if (q.type === 'rating') {
      const n = Number(val);
      if (isNaN(n) || n < 1 || n > 5) {
        throw createError(`Rating for "${q.label}" must be between 1 and 5`);
      }
    }
  }

  // Score quality
  const qualityResult = scoreResponse(answersPayload, completionTimeMs, questions);

  const responseId = uuidv4();

  // Wrap response + answers in a single transaction
  const runAll = db.transaction(() => {
    responseRepository.create({
      id:              responseId,
      surveyId,
      respondentIp:    ip || 'unknown',
      qualityScore:    qualityResult.score,
      qualityFlags:    JSON.stringify(qualityResult.flags),
      qualityLabel:    qualityResult.quality,
      completionTimeMs: completionTimeMs || null,
    });

    const answerRows = answersPayload
      .filter((a) => a.answer_value !== undefined && String(a.answer_value).trim() !== '')
      .map((a) => ({
        id:           uuidv4(),
        response_id:  responseId,
        question_id:  a.question_id,
        answer_value: String(a.answer_value),
      }));

    if (answerRows.length > 0) {
      answerRepository.createMany(answerRows);
    }
  });

  runAll();

  return { response_id: responseId, quality: qualityResult };
}

/**
 * Get aggregated results for a survey.
 */
function getResults(surveyId, userId) {
  // Delegate to surveyService to avoid duplicating result logic
  const surveyService = require('./surveyService');
  return surveyService.getResults(surveyId, userId);
}

module.exports = { submitResponse, getResults };
