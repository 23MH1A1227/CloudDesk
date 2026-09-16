'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ticketService = require('../services/ticket.service');
const statsService = require('../services/stats.service');

const list = asyncHandler(async (req, res) => {
  const result = await ticketService.listTickets(req.user, req.validatedQuery || req.query);
  res.json({ success: true, data: result.items, meta: result.meta });
});

const getOne = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getTicket(req.user, req.params.id);
  res.json({ success: true, data: ticket });
});

const create = asyncHandler(async (req, res) => {
  const ticket = await ticketService.createTicket(req.user, req.body, { ip: req.ip });
  res.status(201).json({ success: true, message: 'Ticket created', data: ticket });
});

const update = asyncHandler(async (req, res) => {
  const ticket = await ticketService.updateTicket(req.user, req.params.id, req.body, { ip: req.ip });
  res.json({ success: true, message: 'Ticket updated', data: ticket });
});

const remove = asyncHandler(async (req, res) => {
  await ticketService.deleteTicket(req.user, req.params.id, { ip: req.ip });
  res.json({ success: true, message: 'Ticket deleted' });
});

const addMessage = asyncHandler(async (req, res) => {
  const message = await ticketService.addMessage(req.user, req.params.id, req.body, { ip: req.ip });
  res.status(201).json({ success: true, message: 'Message sent', data: message });
});

const uploadAttachment = asyncHandler(async (req, res) => {
  const attachment = await ticketService.addAttachment(req.user, req.params.id, req.file, { ip: req.ip });
  res.status(201).json({ success: true, message: 'File uploaded', data: attachment });
});

const analyze = asyncHandler(async (req, res) => {
  const analysis = await ticketService.runAnalysis(req.user, req.params.id, { ip: req.ip });
  res.status(201).json({
    success: true,
    message: analysis.available
      ? 'AI analysis completed'
      : 'AI unavailable - deterministic fallback analysis returned',
    data: analysis,
  });
});

const latestAnalysis = asyncHandler(async (req, res) => {
  const analysis = await ticketService.getLatestAnalysis(req.user, req.params.id);
  res.json({ success: true, data: analysis });
});

const stats = asyncHandler(async (req, res) => {
  const data = await statsService.getDashboardStats(req.user);
  res.json({ success: true, data });
});

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  addMessage,
  uploadAttachment,
  analyze,
  latestAnalysis,
  stats,
};
