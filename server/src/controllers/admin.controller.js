'use strict';

const asyncHandler = require('../utils/asyncHandler');
const adminService = require('../services/admin.service');
const statsService = require('../services/stats.service');
const auditService = require('../services/audit.service');
const { getPagination, buildMeta } = require('../utils/pagination');

// ---- users
const listUsers = asyncHandler(async (req, res) => {
  const result = await adminService.listUsers(req.validatedQuery || req.query);
  res.json({ success: true, data: result.items, meta: result.meta });
});

const createUser = asyncHandler(async (req, res) => {
  const user = await adminService.createUser(req.user, req.body);
  res.status(201).json({ success: true, message: 'User created', data: user });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await adminService.updateUser(req.user, req.params.id, req.body);
  res.json({ success: true, message: 'User updated', data: user });
});

const deleteUser = asyncHandler(async (req, res) => {
  await adminService.deleteUser(req.user, req.params.id);
  res.json({ success: true, message: 'User deleted' });
});

const listAgents = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await adminService.listAgents() });
});

// ---- analytics
const analytics = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await statsService.getAdminAnalytics() });
});

const systemStats = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await statsService.getSystemStats() });
});

// ---- audit
const auditLogs = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const { page, limit, skip } = getPagination(query);
  const { items, total } = await auditService.list({
    skip,
    limit,
    action: query.action,
    actorId: query.actorId,
  });
  res.json({ success: true, data: items, meta: buildMeta(total, page, limit) });
});

// ---- categories
const listCategories = asyncHandler(async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  res.json({ success: true, data: await adminService.listCategories(includeInactive) });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await adminService.createCategory(req.user, req.body);
  res.status(201).json({ success: true, message: 'Category created', data: category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await adminService.updateCategory(req.user, req.params.id, req.body);
  res.json({ success: true, message: 'Category updated', data: category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  await adminService.deleteCategory(req.user, req.params.id);
  res.json({ success: true, message: 'Category deleted' });
});

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listAgents,
  analytics,
  systemStats,
  auditLogs,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
