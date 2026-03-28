const surveyService = require('../services/surveyService');

const getSurveys = (req, res, next) => {
  try {
    const surveys = surveyService.getAllSurveys(req.user.id);
    res.json({ success: true, data: surveys });
  } catch (err) {
    next(err);
  }
};

const getSurvey = (req, res, next) => {
  try {
    const data = surveyService.getSurveyWithQuestions(req.params.id, req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createSurvey = (req, res, next) => {
  try {
    // surveyService.createSurvey now accepts the full body including questions[]
    const survey = surveyService.createSurvey(req.user.id, req.body);
    res.status(201).json({ success: true, data: survey });
  } catch (err) {
    next(err);
  }
};

const updateSurvey = (req, res, next) => {
  try {
    const survey = surveyService.updateSurvey(req.params.id, req.user.id, req.body);
    res.json({ success: true, data: survey });
  } catch (err) {
    next(err);
  }
};

const deleteSurvey = (req, res, next) => {
  try {
    surveyService.deleteSurvey(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: { message: 'Survey deleted' } });
  } catch (err) {
    next(err);
  }
};

const addQuestion = (req, res, next) => {
  try {
    const question = surveyService.addQuestion(req.params.id, req.user.id, req.body);
    res.status(201).json({ success: true, data: question });
  } catch (err) {
    next(err);
  }
};

const updateQuestion = (req, res, next) => {
  try {
    const question = surveyService.updateQuestion(req.params.id, req.params.qid, req.user.id, req.body);
    res.json({ success: true, data: question });
  } catch (err) {
    next(err);
  }
};

const deleteQuestion = (req, res, next) => {
  try {
    surveyService.deleteQuestion(req.params.id, req.params.qid, req.user.id);
    res.status(200).json({ success: true, data: { message: 'Question deleted' } });
  } catch (err) {
    next(err);
  }
};

const getPublicSurvey = (req, res, next) => {
  try {
    const data = surveyService.getPublicSurvey(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateLogicRules = (req, res, next) => {
  try {
    const result = surveyService.updateLogicRules(
      req.params.id,
      req.params.qid,
      req.user.id,
      req.body.logic_rules,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getPulse = (req, res, next) => {
  try {
    const data = surveyService.getPulse(req.params.id, req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getResults = (req, res, next) => {
  try {
    const data = surveyService.getResults(req.params.id, req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getIndividualResponses = (req, res, next) => {
  try {
    const data = surveyService.getIndividualResponses(req.params.id, req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSurveys,
  getSurvey,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getPublicSurvey,
  updateLogicRules,
  getPulse,
  getResults,
  getIndividualResponses,
};
