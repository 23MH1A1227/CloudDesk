import { Link } from 'react-router-dom';
import { Ticket, CircleDot, AlertOctagon, CheckCircle2, Users, Clock, Smile, BarChart3 } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { adminApi } from '../../api/endpoints';
import StatCard from '../../components/ui/StatCard';
import TicketTable from '../../components/tickets/TicketTable';
import { ticketApi } from '../../api/endpoints';
import { Loading, ErrorState, EmptyState } from '../../components/ui/States';
import { StatusDonut, PriorityBar, TicketsOverTime, CategoryBar, WorkloadBar } from '../../components/charts/Charts';
import { formatHours } from '../../utils/format';

export default function AdminDashboard() {
  const analytics = useApi(() => adminApi.analytics(), []);
  const recent = useApi(() => ticketApi.list({ limit: 6, sortBy: 'createdAt' }), []);

  if (analytics.loading && !analytics.data) return <Loading label="Loading platform analytics…" full />;
  if (analytics.error) return <ErrorState message={analytics.error.message} onRetry={analytics.refetch} />;

  const { cards = {}, charts = {}, users = {} } = analytics.data?.data ?? {};

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Platform overview</h1>
          <p className="page-header__sub">Live figures across every ticket, agent and customer on CloudDesk.</p>
        </div>
        <Link className="btn btn--secondary" to="/admin/analytics">
          <BarChart3 size={17} /> Full analytics
        </Link>
      </div>

      <div className="grid grid--stats mb-4">
        <StatCard icon={Ticket} label="Total tickets" value={cards.totalTickets ?? 0} tone="primary" />
        <StatCard icon={CircleDot} label="Open" value={cards.openTickets ?? 0} tone="info" />
        <StatCard icon={Clock} label="Pending" value={cards.pendingTickets ?? 0} tone="warning" />
        <StatCard icon={CheckCircle2} label="Resolved" value={cards.resolvedTickets ?? 0} tone="success" />
        <StatCard icon={AlertOctagon} label="Urgent" value={cards.urgentTickets ?? 0} tone="danger" />
        <StatCard
          icon={Users}
          label="Users"
          value={users.total ?? 0}
          hint={`${users.byRole?.SUPPORT_AGENT ?? 0} agents · ${users.byRole?.CUSTOMER ?? 0} customers`}
          tone="primary"
        />
        <StatCard icon={Clock} label="Avg. first response" value={formatHours(cards.averageResponseHours)} tone="warning" />
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
            <span className="card__title">Created vs resolved</span>
          </div>
          <div className="card__body card__body--tight">
            <TicketsOverTime data={charts.overTime} />
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
            <span className="card__title">Priority distribution</span>
          </div>
          <div className="card__body card__body--tight">
            <PriorityBar data={charts.byPriority} />
          </div>
        </section>
      </div>

      <section className="card mb-4">
        <div className="card__header">
          <span className="card__title">Agent workload</span>
        </div>
        <div className="card__body card__body--tight">
          <WorkloadBar data={charts.agentWorkload} />
        </div>
      </section>

      <section className="card">
        <div className="card__header">
          <span className="card__title">Latest tickets</span>
          <Link className="btn btn--ghost btn--sm" to="/admin/tickets">
            Manage tickets
          </Link>
        </div>
        {recent.loading && <Loading />}
        {recent.error && <ErrorState message={recent.error.message} onRetry={recent.refetch} />}
        {!recent.loading && !recent.error && recent.data?.data?.length === 0 && (
          <EmptyState icon={Ticket} title="No tickets yet" message="Once customers start raising tickets they will appear here." />
        )}
        {!recent.loading && recent.data?.data?.length > 0 && <TicketTable tickets={recent.data.data} />}
      </section>
    </>
  );
}
