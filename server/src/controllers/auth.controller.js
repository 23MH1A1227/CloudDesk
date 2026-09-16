'use strict';

const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body, { ip: req.ip });
  res.status(201).json({ success: true, message: 'Account created', data: result });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, { ip: req.ip });
  res.json({ success: true, message: 'Signed in', data: result });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.json({ success: true, data: { user } });
});

const updateMe = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  res.json({ success: true, message: 'Profile updated', data: { user } });
});

module.exports = { register, login, me, updateMe };
