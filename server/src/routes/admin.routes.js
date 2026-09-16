'use strict';

const router = require('express').Router();
const controller = require('../controllers/admin.controller');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { idParam } = require('../validation/ticket.schema');
const {
  createUserSchema,
  updateUserSchema,
  listUsersSchema,
  categorySchema,
  updateCategorySchema,
  auditQuerySchema,
} = require('../validation/admin.schema');

router.use(authenticate);

// Agents need the agent list for ticket assignment; everything else is admin-only.
router.get('/agents', authorize('SUPPORT_AGENT', 'ADMIN'), controller.listAgents);

router.use(authorize('ADMIN'));

router.get('/users', validate({ query: listUsersSchema }), controller.listUsers);
router.post('/users', validate({ body: createUserSchema }), controller.createUser);
router.patch('/users/:id', validate({ params: idParam, body: updateUserSchema }), controller.updateUser);
router.delete('/users/:id', validate({ params: idParam }), controller.deleteUser);

router.get('/analytics', controller.analytics);
router.get('/system', controller.systemStats);
router.get('/audit-logs', validate({ query: auditQuerySchema }), controller.auditLogs);

router.get('/categories', controller.listCategories);
router.post('/categories', validate({ body: categorySchema }), controller.createCategory);
router.patch('/categories/:id', validate({ params: idParam, body: updateCategorySchema }), controller.updateCategory);
router.delete('/categories/:id', validate({ params: idParam }), controller.deleteCategory);

module.exports = router;
