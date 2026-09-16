'use strict';

const router = require('express').Router();
const controller = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { registerSchema, loginSchema, updateProfileSchema } = require('../validation/auth.schema');

router.post('/register', authLimiter, validate({ body: registerSchema }), controller.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), controller.login);
router.get('/me', authenticate, controller.me);
router.patch('/me', authenticate, validate({ body: updateProfileSchema }), controller.updateMe);

module.exports = router;
