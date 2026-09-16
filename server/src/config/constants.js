'use strict';

module.exports = {
  ROLES: { CUSTOMER: 'CUSTOMER', SUPPORT_AGENT: 'SUPPORT_AGENT', ADMIN: 'ADMIN' },
  TICKET_STATUSES: ['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'],
  PRIORITIES: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
  SENTIMENTS: ['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'FRUSTRATED'],
  ALLOWED_MIME_TYPES: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'],
  ALLOWED_EXTENSIONS: ['.png', '.jpg', '.jpeg', '.pdf'],
};
