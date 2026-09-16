import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, PlusCircle, Ticket as TicketIcon, LayoutGrid, List, X } from 'lucide-react';
import { ticketApi, categoryApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import TicketTable from '../components/tickets/TicketTable';
import TicketCard from '../components/tickets/TicketCard';
import Pagination from '../components/ui/Pagination';
import { Loading, ErrorState, EmptyState, TableSkeleton } from '../components/ui/States';
import { STATUS_LABELS, PRIORITY_LABELS } from '../utils/format';

const DEBOUNCE_MS = 350;

export default function TicketList() {
  const { isCustomer, isStaff } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tickets, setTickets] = useState([]);
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('table');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const filters = useMemo(
    () => ({
      page: Number(searchParams.get('page')) || 1,
      limit: 10,
      status: searchParams.get('status') || '',
      priority: searchParams.get('priority') || '',
      categoryId: searchParams.get('categoryId') || '',
      scope: searchParams.get('scope') || '',
      search: searchParams.get('search') || '',
    }),
    [searchParams]
  );

  const setFilter = useCallback(
    (key, value) => {
      const next = new URLSearchParams(searchParams);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== 'page') next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Debounce the search box so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) setFilter('search', searchInput.trim());
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, setFilter]);

  useEffect(() => {
    categoryApi
      .list()
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined));

    ticketApi
      .list(params)
      .then((res) => {
        if (cancelled) return;
        setTickets(res.data);
        setMeta(res.meta);
      })
      .catch((err) => !cancelled && setError(err))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const activeFilterCount = ['status', 'priority', 'categoryId', 'scope', 'search'].filter((k) => filters[k]).length;

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{isCustomer ? 'My tickets' : 'All tickets'}</h1>
          <p className="page-header__sub">
            {meta ? `${meta.total} ticket${meta.total === 1 ? '' : 's'}` : 'Loading…'}
            {filters.scope === 'mine' && ' assigned to you'}
            {filters.scope === 'unassigned' && ' waiting to be picked up'}
          </p>
        </div>
        <div className="row gap-2">
          <div className="row gap-1">
            <button
              className={`btn btn--sm ${view === 'table' ? 'btn--secondary' : 'btn--ghost'}`}
              onClick={() => setView('table')}
              aria-label="Table view"
            >
              <List size={15} />
            </button>
            <button
              className={`btn btn--sm ${view === 'grid' ? 'btn--secondary' : 'btn--ghost'}`}
              onClick={() => setView('grid')}
              aria-label="Card view"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
          {isCustomer && (
            <Link className="btn btn--primary" to="/tickets/new">
              <PlusCircle size={17} /> New ticket
            </Link>
          )}
        </div>
      </div>

      <section className="card mb-4">
        <div className="card__body card__body--tight">
          <div className="filters">
            <div className="input-group">
              <Search size={16} className="input-group__icon" />
              <input
                className="input"
                placeholder="Search by subject, description or reference…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Search tickets"
              />
            </div>

            <select className="select" value={filters.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Filter by status">
              <option value="">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select className="select" value={filters.priority} onChange={(e) => setFilter('priority', e.target.value)} aria-label="Filter by priority">
              <option value="">All priorities</option>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              className="select"
              value={filters.categoryId}
              onChange={(e) => setFilter('categoryId', e.target.value)}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {isStaff && (
              <select className="select" value={filters.scope} onChange={(e) => setFilter('scope', e.target.value)} aria-label="Filter by assignment">
                <option value="">Everyone&apos;s tickets</option>
                <option value="mine">Assigned to me</option>
                <option value="unassigned">Unassigned</option>
              </select>
            )}

            {activeFilterCount > 0 && (
              <button className="btn btn--ghost btn--sm" onClick={clearFilters}>
                <X size={14} /> Clear ({activeFilterCount})
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="card">
        {loading && (view === 'table' ? <TableSkeleton /> : <Loading />)}
        {error && <ErrorState message={error.message} onRetry={() => setSearchParams(new URLSearchParams(searchParams))} />}

        {!loading && !error && tickets.length === 0 && (
          <EmptyState
            icon={TicketIcon}
            title={activeFilterCount ? 'No tickets match these filters' : 'No tickets yet'}
            message={
              activeFilterCount
                ? 'Try widening your search or clearing the filters.'
                : isCustomer
                  ? 'Raise your first support request and it will appear here.'
                  : 'Tickets raised by customers will appear here.'
            }
            action={
              activeFilterCount ? (
                <button className="btn btn--secondary btn--sm" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : isCustomer ? (
                <Link className="btn btn--primary btn--sm" to="/tickets/new">
                  <PlusCircle size={15} /> New ticket
                </Link>
              ) : null
            }
          />
        )}

        {!loading && !error && tickets.length > 0 && (
          <>
            {view === 'table' ? (
              <TicketTable tickets={tickets} showCustomer={!isCustomer} showAssignee={!isCustomer} />
            ) : (
              <div className="card__body">
                <div className="grid grid--2">
                  {tickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} showCustomer={!isCustomer} />
                  ))}
                </div>
              </div>
            )}
            <Pagination meta={meta} onChange={(page) => setFilter('page', String(page))} />
          </>
        )}
      </section>
    </>
  );
}
