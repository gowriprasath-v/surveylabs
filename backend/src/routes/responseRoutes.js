/**
 * @swagger
 * /api/public/surveys/{id}/respond:
 *   post:
 *     summary: Submit a response for a public survey
 *     tags: [Responses]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [answers]
 *             properties:
 *               completion_time_ms: { type: integer, example: 15400 }
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question_id: { type: string }
 *                     answer_value: { type: string }
 *     responses:
 *       201:
 *         description: Response submitted successfully
 *       400:
 *         description: Validation error
 */
const express = require('express');
const router = express.Router();
const responseController = require('../controllers/responseController');
const validate = require('../middleware/validate');

router.post('/public/surveys/:id/respond', validate.validateResponse, responseController.submitResponse);

module.exports = router;
