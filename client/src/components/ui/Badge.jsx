import { STATUS_LABELS, STATUS_TONE, PRIORITY_LABELS, PRIORITY_TONE, SENTIMENT_TONE, ROLE_LABELS, titleCase } from '../../utils/format';

export default function Badge({ tone = 'neutral', children, dot = false, className = '' }) {
  return (
    <span className={`badge badge--${tone} ${className}`}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  return (
    <Badge tone={STATUS_TONE[status] || 'neutral'} dot>
      {STATUS_LABELS[status] || titleCase(status)}
    </Badge>
  );
}

export function PriorityBadge({ priority }) {
  return <Badge tone={PRIORITY_TONE[priority] || 'neutral'}>{PRIORITY_LABELS[priority] || titleCase(priority)}</Badge>;
}

export function SentimentBadge({ sentiment }) {
  return <Badge tone={SENTIMENT_TONE[sentiment] || 'neutral'}>{titleCase(sentiment)}</Badge>;
}

export function RoleBadge({ role }) {
  const tone = role === 'ADMIN' ? 'primary' : role === 'SUPPORT_AGENT' ? 'info' : 'neutral';
  return <Badge tone={tone}>{ROLE_LABELS[role] || titleCase(role)}</Badge>;
}

export function CategoryBadge({ category }) {
  if (!category) return <Badge tone="neutral">Uncategorised</Badge>;
  return (
    <span
      className="badge"
      style={{
        background: `color-mix(in srgb, ${category.color} 16%, transparent)`,
        color: category.color,
      }}
    >
      {category.name}
    </span>
  );
}
