import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Ticket as TicketIcon, Trash2, UserCheck } from 'lucide-react';
import { ticketApi, categoryApi, adminApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/Modal';
import { PriorityBadge, CategoryBadge } from '../../components/ui/Badge';
import { UserCell } from '../../components/ui/Avatar';
import { ErrorState, EmptyState, TableSkeleton } from '../../components/ui/States';
import { STATUS_LABELS, PRIORITY_LABELS, formatDate } from '../../utils/format';

const STATUSES = Object.keys(STATUS_LABELS);
const PRIORITIES = Object.keys(PRIORITY_LABELS);

export default function TicketManagement() {
  const toast = useToast();

  const [tickets, setTickets] = useState([]);
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', priority: '', categoryId: '', assigneeId: '' });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 12, search: search || undefined };
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const res = await ticketApi.list(params);
      setTickets(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page, filters, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    categoryApi.list().then((res) => setCategories(res.data)).catch(() => setCategories([]));
    adminApi.agents().then((res) => setAgents(res.data)).catch(() => setAgents([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const setFilter = (key) => (event) => {
    setFilters((current) => ({ ...current, [key]: event.target.value }));
    setPage(1);
  };

  const patchTicket = async (ticket, payload, message) => {
    try {
      const res = await ticketApi.update(ticket.id, payload);
      setTickets((current) => current.map((t) => (t.id === ticket.id ? { ...t, ...res.data } : t)));
      toast.success('Ticket updated', message);
    } catch (err) {
      toast.error('Update failed', err.message);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await ticketApi.remove(toDelete.id);
      toast.success('Ticket deleted', toDelete.reference);
      setToDelete(null);
      load();
    } catch (err) {
      toast.error('Delete failed', err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Ticket management</h1>
          <p className="page-header__sub">Triage, reassign or remove any ticket on the platform.</p>
        </div>
      </div>

      <section className="card">
        <div className="card__body card__body--tight">
          <div className="filters">
            <div className="input-group">
              <Search size={16} className="input-group__icon" />
              <input
                className="input"
                placeholder="Search reference, title or description…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <select className="select" value={filters.status} onChange={setFilter('status')}>
              <option value="">All statuses</option>
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>
            <select className="select" value={filters.priority} onChange={setFilter('priority')}>
              <option value="">All priorities</option>
              {PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {PRIORITY_LABELS[value]}
                </option>
              ))}
            </select>
            <select className="select" value={filters.categoryId} onChange={setFilter('categoryId')}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select className="select" value={filters.assigneeId} onChange={setFilter('assigneeId')}>
              <option value="">Any assignee</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          {loading && <TableSkeleton rows={8} cols={6} />}
          {!loading && error && <ErrorState message={error.message} onRetry={load} />}
          {!loading && !error && tickets.length === 0 && (
            <EmptyState icon={TicketIcon} title="No tickets match" message="Adjust the filters to widen your search." />
          )}

          {!loading && !error && tickets.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assignee</th>
                    <th>Created</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>
                        <Link to={`/tickets/${ticket.id}`} className="table__cell-strong">
                          {ticket.title}
                        </Link>
                        <div className="row gap-2 mt-2">
                          <span className="mono text-xs text-subtle">{ticket.reference}</span>
                          <CategoryBadge category={ticket.category} />
                        </div>
                      </td>
                      <td>
                        <UserCell user={ticket.customer} showEmail={false} />
                      </td>
                      <td>
                        <select
                          className="select"
                          value={ticket.status}
                          onChange={(e) =>
                            patchTicket(ticket, { status: e.target.value }, `${ticket.reference} → ${STATUS_LABELS[e.target.value]}`)
                          }
                        >
                          {STATUSES.map((value) => (
                            <option key={value} value={value}>
                              {STATUS_LABELS[value]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td>
                        <select
                          className="select"
                          value={ticket.assigneeId || ''}
                          onChange={(e) =>
                            patchTicket(
                              ticket,
                              { assigneeId: e.target.value || null },
                              e.target.value ? 'Ticket reassigned.' : 'Ticket unassigned.'
                            )
                          }
                        >
                          <option value="">Unassigned</option>
                          {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="text-muted" style={{ whiteSpace: 'nowrap' }}>
                        {formatDate(ticket.createdAt)}
                      </td>
                      <td>
                        <div className="table__actions">
                          <Link className="btn btn--ghost btn--sm" to={`/tickets/${ticket.id}`}>
                            <UserCheck size={14} /> Open
                          </Link>
                          <button className="btn btn--ghost btn--sm text-danger" onClick={() => setToDelete(ticket)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
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

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        busy={deleting}
        danger
        title="Delete ticket?"
        confirmLabel="Delete ticket"
        message={`${toDelete?.reference} and all of its messages, attachments and analyses will be removed.`}
      />
    </div>
  );
}
