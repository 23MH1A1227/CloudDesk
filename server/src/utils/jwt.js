'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');

const signToken = (payload) =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn, issuer: 'clouddesk' });

const verifyToken = (token) => jwt.verify(token, env.jwtSecret, { issuer: 'clouddesk' });

module.exports = { signToken, verifyToken };
