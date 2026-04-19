const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

/**
 * @swagger
 * /api/admin/analytics/global:
 *   get:
 *     summary: Get global analytics across all user surveys
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Global analytics data retrieved
 */
router.get('/admin/analytics/global', requireAuth, analyticsController.getGlobalAnalytics);
router.get('/admin/analytics/conversations', requireAuth, analyticsController.getConversationalSessions);
router.get('/admin/export/:format', requireAuth, analyticsController.exportDatabase);

module.exports = router;
