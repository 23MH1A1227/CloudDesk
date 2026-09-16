import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';

export function Loading({ label = 'Loading…', full = false }) {
  return (
    <div className="state" style={full ? { minHeight: '60vh' } : undefined} role="status">
      <div className="spinner spinner--lg" />
      <p className="state__text">{label}</p>
    </div>
  );
}

export function FullPageLoading({ label = 'Starting CloudDesk…' }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div className="state">
        <div className="spinner spinner--lg" />
        <p className="state__text">{label}</p>
      </div>
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, retryLabel = 'Try again' }) {
  return (
    <div className="state" role="alert">
      <div className="state__icon" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
        <AlertTriangle size={24} />
      </div>
      <div className="state__title">{title}</div>
      {message && <p className="state__text">{message}</p>}
      {onRetry && (
        <button className="btn btn--secondary" onClick={onRetry}>
          <RefreshCw size={15} /> {retryLabel}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', message, action }) {
  return (
    <div className="state">
      <div className="state__icon">
        <Icon size={24} />
      </div>
      <div className="state__title">{title}</div>
      {message && <p className="state__text">{message}</p>}
      {action}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div style={{ padding: 'var(--space-4)' }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="row gap-4" style={{ marginBottom: 12 }}>
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className="skeleton" style={{ height: 16, flex: c === 0 ? 2 : 1 }} />
          ))}
        </div>
      ))}
    </div>
  );
}
