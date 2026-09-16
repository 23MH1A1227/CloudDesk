'use strict';

const router = require('express').Router();
const controller = require('../controllers/ticket.controller');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const { aiLimiter } = require('../middleware/rateLimit');
const {
  idParam,
  createTicketSchema,
  updateTicketSchema,
  listTicketsSchema,
  messageSchema,
} = require('../validation/ticket.schema');

router.use(authenticate);

router.get('/stats', controller.stats);
router.get('/', validate({ query: listTicketsSchema }), controller.list);
router.post('/', validate({ body: createTicketSchema }), controller.create);

router.get('/:id', validate({ params: idParam }), controller.getOne);
router.patch('/:id', validate({ params: idParam, body: updateTicketSchema }), controller.update);
router.delete('/:id', authorize('ADMIN'), validate({ params: idParam }), controller.remove);

router.post('/:id/messages', validate({ params: idParam, body: messageSchema }), controller.addMessage);
router.post('/:id/attachments', validate({ params: idParam }), uploadSingle('file'), controller.uploadAttachment);

router.post('/:id/analyze', aiLimiter, validate({ params: idParam }), controller.analyze);
router.get('/:id/analysis', validate({ params: idParam }), controller.latestAnalysis);

module.exports = router;
