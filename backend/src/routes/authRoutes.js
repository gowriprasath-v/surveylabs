/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate and get JWT token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string, example: admin }
 *               password: { type: string, example: admin123 }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       201:
 *         description: User registered successfully
 *
 * /api/auth/me:
 *   get:
 *     summary: Verify token and return current user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Authenticated user returned
 *       401:
 *         description: Invalid or missing token
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/login',    validate.validateLogin, authController.login);
router.post('/register', validate.validateLogin, authController.register);
router.get('/me',        requireAuth,            authController.me);

module.exports = router;
