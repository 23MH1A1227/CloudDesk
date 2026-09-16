import { Link } from 'react-router-dom';
import { Ticket, CircleDot, AlertOctagon, CheckCircle2, Clock, Inbox, Smile } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { ticketApi } from '../../api/endpoints';
import StatCard from '../../components/ui/StatCard';
import TicketTable from '../../components/tickets/TicketTable';
import { Loading, ErrorState, EmptyState } from '../../components/ui/States';
import { StatusDonut, PriorityBar, TicketsOverTime, CategoryBar } from '../../components/charts/Charts';
import { formatHours } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';

export default function AgentDashboard() {
  const { user } = useAuth();
  const stats = useApi(() => ticketApi.stats(), []);
  const queue = useApi(() => ticketApi.list({ limit: 6, status: 'OPEN', sortBy: 'createdAt', sortOrder: 'asc' }), []);

  if (stats.loading && !stats.data) return <Loading label="Loading the support queue…" full />;
  if (stats.error) return <ErrorState message={stats.error.message} onRetry={stats.refetch} />;

  const cards = stats.data?.data?.cards ?? {};
  const charts = stats.data?.data?.charts ?? {};

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Support workspace</h1>
          <p className="page-header__sub">Signed in as {user?.name}. Oldest open tickets are listed first below.</p>
        </div>
        <Link className="btn btn--primary" to="/tickets?scope=mine">
          <Inbox size={17} /> Assigned to me
        </Link>
      </div>

      <div className="grid grid--stats mb-4">
        <StatCard icon={Ticket} label="Total tickets" value={cards.totalTickets ?? 0} tone="primary" />
        <StatCard icon={CircleDot} label="Open" value={cards.openTickets ?? 0} tone="info" />
        <StatCard icon={Inbox} label="Assigned to me" value={cards.assignedToMe ?? 0} tone="primary" />
        <StatCard icon={AlertOctagon} label="Urgent" value={cards.urgentTickets ?? 0} tone="danger" />
        <StatCard icon={CheckCircle2} label="Resolved" value={cards.resolvedTickets ?? 0} tone="success" />
        <StatCard
          icon={Clock}
          label="Avg. first response"
          value={formatHours(cards.averageResponseHours)}
          tone="warning"
        />
        <StatCard
          icon={Smile}
          label="Satisfaction"
          value={cards.satisfaction?.average ? `${cards.satisfaction.average}/5` : '—'}
          hint={`${cards.satisfaction?.responses ?? 0} response(s)`}
          tone="success"
        />
      </div>

      <div className="grid grid--2 mb-4">
        <section className="card">
          <div className="card__header">
            <span className="card__title">Tickets by status</span>
          </div>
          <div className="card__body card__body--tight">
            <StatusDonut data={charts.byStatus} />
          </div>
        </section>
        <section className="card">
          <div className="card__header">
            <span className="card__title">Priority distribution</span>
          </div>
          <div className="card__body card__body--tight">
            <PriorityBar data={charts.byPriority} />
          </div>
        </section>
        <section className="card">
          <div className="card__header">
            <span className="card__title">Tickets by category</span>
          </div>
          <div className="card__body card__body--tight">
            <CategoryBar data={charts.byCategory} />
          </div>
        </section>
        <section className="card">
          <div className="card__header">
            <span className="card__title">Created vs resolved</span>
          </div>
          <div className="card__body card__body--tight">
            <TicketsOverTime data={charts.overTime} />
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card__header">
          <span className="card__title">Oldest open tickets</span>
          <Link className="btn btn--ghost btn--sm" to="/tickets">
            View all tickets
          </Link>
        </div>
        {queue.loading && <Loading />}
        {queue.error && <ErrorState message={queue.error.message} onRetry={queue.refetch} />}
        {!queue.loading && !queue.error && queue.data?.data?.length === 0 && (
          <EmptyState icon={CheckCircle2} title="The open queue is empty" message="Every open ticket has been picked up. Nice work." />
        )}
        {!queue.loading && queue.data?.data?.length > 0 && <TicketTable tickets={queue.data.data} />}
      </section>
    </>
  );
}
