'use strict';

const router = require('express').Router();
const controller = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth');

// Any signed-in user can read the category list (needed to create a ticket).
// Mutating categories lives under /api/admin/categories.
router.get('/', authenticate, controller.listCategories);

module.exports = router;
