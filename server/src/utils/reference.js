'use strict';

const crypto = require('crypto');

/** Human-friendly ticket reference, e.g. CD-8F3A21. */
const generateTicketReference = () =>
  `CD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

module.exports = { generateTicketReference };
