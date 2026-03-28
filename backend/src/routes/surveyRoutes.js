/**
 * @swagger
 * /api/admin/surveys:
 *   get:
 *     summary: List all user surveys
 *     tags: [Surveys]
 *     responses:
 *       200:
 *         description: Survey list successfully retrieved
 *   post:
 *     summary: Create a new survey
 *     tags: [Surveys]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *     responses:
 *       201:
 *         description: Survey created successfully
 *
 * /api/admin/surveys/{id}:
 *   get:
 *     summary: Get a specific survey with questions
 *     tags: [Surveys]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Survey retrieved successfully
 *   put:
 *     summary: Update an existing survey and questions
 *     tags: [Surveys]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Survey updated successfully
 *   delete:
 *     summary: Delete a specific survey
 *     tags: [Surveys]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Survey deleted successfully
 *
 * /api/admin/surveys/{id}/results:
 *   get:
 *     summary: Get aggregated results for a survey
 *     tags: [Surveys]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Results data retrieved successfully
 *
 * /api/admin/surveys/{id}/pulse:
 *   get:
 *     summary: Get live response pulse logic for a survey
 *     tags: [Surveys]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pulse data retrieved successfully
 *
 * /api/public/surveys/{id}:
 *   get:
 *     summary: Fetch public survey metadata and questions
 *     tags: [Responses]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Public survey fetched successfully
 */
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const surveyController = require('../controllers/surveyController');
const responseController = require('../controllers/responseController');

// Admin routes (require auth)
const validate = require('../middleware/validate');

router.get('/admin/surveys', requireAuth, surveyController.getSurveys);
router.post('/admin/surveys', requireAuth, validate.validateSurvey, surveyController.createSurvey);
router.get('/admin/surveys/:id', requireAuth, surveyController.getSurvey);
router.put('/admin/surveys/:id', requireAuth, validate.validateSurvey, surveyController.updateSurvey);
router.delete('/admin/surveys/:id', requireAuth, surveyController.deleteSurvey);
router.post('/admin/surveys/:id/questions', requireAuth, surveyController.addQuestion);
router.put('/admin/surveys/:id/questions/:qid', requireAuth, surveyController.updateQuestion);
router.delete('/admin/surveys/:id/questions/:qid', requireAuth, surveyController.deleteQuestion);
router.put('/admin/surveys/:id/questions/:qid/logic', requireAuth, surveyController.updateLogicRules);
router.get('/admin/surveys/:id/results', requireAuth, surveyController.getResults);
router.get('/admin/surveys/:id/pulse', requireAuth, surveyController.getPulse);
router.get('/admin/surveys/:id/responses', requireAuth, surveyController.getIndividualResponses);

// Public routes (no auth)
router.get('/public/surveys/:id', surveyController.getPublicSurvey);

module.exports = router;
