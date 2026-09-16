import { useCallback, useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import { UserCell } from '../../components/ui/Avatar';
import { ErrorState, EmptyState, TableSkeleton } from '../../components/ui/States';
import { formatDateTime, titleCase } from '../../utils/format';

const ACTIONS = [
  'USER_LOGIN',
  'USER_REGISTERED',
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DELETED',
  'TICKET_CREATED',
  'TICKET_UPDATED',
  'TICKET_ASSIGNED',
  'TICKET_STATUS_CHANGED',
  'TICKET_DELETED',
  'TICKET_MESSAGE_SENT',
  'ATTACHMENT_UPLOADED',
  'AI_ANALYSIS_REQUESTED',
  'CATEGORY_CREATED',
  'CATEGORY_UPDATED',
  'CATEGORY_DELETED',
];

const toneFor = (action) => {
  if (action.includes('DELETED')) return 'danger';
  if (action.includes('CREATED') || action.includes('REGISTERED')) return 'success';
  if (action.includes('AI_')) return 'primary';
  if (action.includes('LOGIN')) return 'info';
  return 'warning';
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.auditLogs({ page, limit: 20, action: action || undefined });
      setLogs(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page, action]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Audit logs</h1>
          <p className="page-header__sub">An append-only trail of security and ticket-relevant actions.</p>
        </div>
      </div>

      <section className="card">
        <div className="card__body card__body--tight">
          <div className="filters">
            <select
              className="select"
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All actions</option>
              {ACTIONS.map((value) => (
                <option key={value} value={value}>
                  {titleCase(value)}
                </option>
              ))}
            </select>
          </div>

          {loading && <TableSkeleton rows={8} cols={4} />}
          {!loading && error && <ErrorState message={error.message} onRetry={load} />}
          {!loading && !error && logs.length === 0 && (
            <EmptyState icon={ScrollText} title="No audit entries" message="Actions will be recorded here as they happen." />
          )}

          {!loading && !error && logs.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Entity</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="text-muted" style={{ whiteSpace: 'nowrap' }}>
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td>
                        <Badge tone={toneFor(log.action)}>{titleCase(log.action)}</Badge>
                      </td>
                      <td>
                        {log.actor ? <UserCell user={log.actor} /> : <span className="text-subtle">System</span>}
                      </td>
                      <td>
                        <span className="mono text-xs">
                          {log.entity}
                          {log.entityId ? `#${String(log.entityId).slice(0, 8)}` : ''}
                        </span>
                      </td>
                      <td className="text-xs text-muted" style={{ maxWidth: 280 }}>
                        <span className="truncate" style={{ display: 'block' }}>
                          {log.metadata ? JSON.stringify(log.metadata) : '—'}
                        </span>
                        {log.ip && <div className="text-subtle">{log.ip}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {meta && <Pagination meta={meta} onChange={setPage} />}
      </section>
    </div>
  );
}
