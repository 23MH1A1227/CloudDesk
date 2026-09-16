export const STATUS_LABELS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  PENDING: 'Pending',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const PRIORITY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const ROLE_LABELS = {
  CUSTOMER: 'Customer',
  SUPPORT_AGENT: 'Support agent',
  ADMIN: 'Administrator',
};

export const STATUS_TONE = {
  OPEN: 'info',
  IN_PROGRESS: 'primary',
  PENDING: 'warning',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

export const PRIORITY_TONE = {
  LOW: 'neutral',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'danger',
};

export const SENTIMENT_TONE = {
  POSITIVE: 'success',
  NEUTRAL: 'neutral',
  NEGATIVE: 'warning',
  FRUSTRATED: 'danger',
};

export const CHART_COLORS = ['#4f46e5', '#0ea5e9', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#14b8a6'];

export const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const relativeTime = (value) => {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
};

export const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const formatHours = (hours) => {
  if (hours === null || hours === undefined) return '—';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours.toFixed(1)} hrs`;
  return `${(hours / 24).toFixed(1)} days`;
};

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

export const titleCase = (value = '') =>
  value.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
