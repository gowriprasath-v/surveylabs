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

function evaluateRules(allQuestions, currentAnswers) {
  const hidden = new Set();
  for (const q of allQuestions) {
    let rules = q.logic_rules;
    if (typeof rules === 'string') {
      try { rules = JSON.parse(rules); } catch (e) { rules = null; }
    }
    if (!rules || !Array.isArray(rules) || rules.length === 0) continue;

    const myAnswer = currentAnswers[q.id];
    if (myAnswer === undefined || myAnswer === '') continue;

    for (const rule of rules) {
      let match = false;
      if (rule.if_answer_equals && String(myAnswer) === String(rule.if_answer_equals)) match = true;
      if (rule.if_answer_contains && String(myAnswer).toLowerCase().includes(String(rule.if_answer_contains).toLowerCase())) match = true;
      if (rule.if_answer_greater_than && !isNaN(myAnswer) && Number(myAnswer) > Number(rule.if_answer_greater_than)) match = true;
      if (rule.if_answer_less_than && !isNaN(myAnswer) && Number(myAnswer) < Number(rule.if_answer_less_than)) match = true;
      if (rule.if_answer_is_empty && (!myAnswer || String(myAnswer).trim() === '')) match = true;

      if (match) {
        if (rule.then_skip_to_question_id) {
          const targetIdx = allQuestions.findIndex((qq) => qq.id === rule.then_skip_to_question_id);
          const currentIdx = allQuestions.findIndex((qq) => qq.id === q.id);
          if (targetIdx > currentIdx) {
            for (let i = currentIdx + 1; i < targetIdx; i++) hidden.add(allQuestions[i].id);
          }
        }
        if (rule.then_end_survey) {
          const currentIdx = allQuestions.findIndex((qq) => qq.id === q.id);
          for (let i = currentIdx + 1; i < allQuestions.length; i++) hidden.add(allQuestions[i].id);
        }
      }
    }
  }
  return hidden;
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

  // Validate required questions (considering logic rules)
  const hidden = evaluateRules(questions, answersMap);
  const visibleQuestions = questions.filter(q => !hidden.has(q.id));
  
  for (const q of visibleQuestions) {
    if (q.required) {
      const val = answersMap[q.id];
      if (val === undefined || val === null || String(val).trim() === '') {
        throw createError(`Question "${q.label}" is required`);
      }
    }
  }

  // Note: duplicate IP detection
  const isDuplicateIp = responseRepository.hasIpResponded(surveyId, ip);

  // Score quality
  const qualityResult = scoreResponse(answersPayload, completionTimeMs, questions, isDuplicateIp);

  const responseId = uuidv4();

  // Wrap response + answers in a single transaction
  let createdResponse = null;
  const runAll = db.transaction(() => {
    createdResponse = responseRepository.create({
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

    // ADDED — keep stored count in sync
    // NOTE: frontend NEVER reads this stored value for display.
    // This sync is for data integrity only.
    try {
      db.prepare(`
        UPDATE surveys
        SET total_responses = (
          SELECT COUNT(*) FROM responses WHERE survey_id = ?
        )
        WHERE id = ?`
      ).run(surveyId, surveyId);
    } catch (err) {
      // Ignored if total_responses column does not exist
    }
  });

  runAll();

  return {
    ...(createdResponse || { id: responseId, survey_id: surveyId }),
    quality: qualityResult,
  };
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
