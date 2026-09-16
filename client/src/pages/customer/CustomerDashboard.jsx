import { Link } from 'react-router-dom';
import { Ticket, CircleDot, CheckCircle2, Clock, PlusCircle, Smile } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { ticketApi } from '../../api/endpoints';
import StatCard from '../../components/ui/StatCard';
import TicketCard from '../../components/tickets/TicketCard';
import { Loading, ErrorState, EmptyState } from '../../components/ui/States';
import { StatusDonut, TicketsOverTime } from '../../components/charts/Charts';
import { formatHours } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const stats = useApi(() => ticketApi.stats(), []);
  const recent = useApi(() => ticketApi.list({ limit: 4, sortBy: 'updatedAt' }), []);

  if (stats.loading && !stats.data) return <Loading label="Loading your dashboard…" full />;
  if (stats.error) return <ErrorState message={stats.error.message} onRetry={stats.refetch} />;

  const cards = stats.data?.data?.cards ?? {};
  const charts = stats.data?.data?.charts ?? {};

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Hello, {user?.name?.split(' ')[0]}</h1>
          <p className="page-header__sub">Here is where your support requests currently stand.</p>
        </div>
        <Link className="btn btn--primary" to="/tickets/new">
          <PlusCircle size={17} /> New ticket
        </Link>
      </div>

      <div className="grid grid--stats mb-4">
        <StatCard icon={Ticket} label="Total tickets" value={cards.totalTickets ?? 0} tone="primary" />
        <StatCard icon={CircleDot} label="Open" value={cards.openTickets ?? 0} tone="info" />
        <StatCard icon={Clock} label="Awaiting your reply" value={cards.pendingTickets ?? 0} tone="warning" />
        <StatCard icon={CheckCircle2} label="Resolved" value={cards.resolvedTickets ?? 0} tone="success" />
        <StatCard
          icon={Clock}
          label="Avg. first response"
          value={formatHours(cards.averageResponseHours)}
          hint="Across your tickets"
          tone="info"
        />
        <StatCard
          icon={Smile}
          label="Your avg. rating"
          value={cards.satisfaction?.average ? `${cards.satisfaction.average}/5` : '—'}
          hint={`${cards.satisfaction?.responses ?? 0} rating(s) given`}
          tone="success"
        />
      </div>

      <div className="grid grid--2 mb-4">
        <section className="card">
          <div className="card__header">
            <span className="card__title">Your tickets by status</span>
          </div>
          <div className="card__body card__body--tight">
            <StatusDonut data={charts.byStatus} />
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <span className="card__title">Activity over the last 14 days</span>
          </div>
          <div className="card__body card__body--tight">
            <TicketsOverTime data={charts.overTime} />
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card__header">
          <span className="card__title">Recently updated</span>
          <Link className="btn btn--ghost btn--sm" to="/tickets">
            View all
          </Link>
        </div>
        <div className="card__body">
          {recent.loading && <Loading />}
          {recent.error && <ErrorState message={recent.error.message} onRetry={recent.refetch} />}
          {!recent.loading && !recent.error && recent.data?.data?.length === 0 && (
            <EmptyState
              icon={Ticket}
              title="No tickets yet"
              message="When you raise a support request it will appear here with its live status."
              action={
                <Link className="btn btn--primary btn--sm" to="/tickets/new">
                  <PlusCircle size={15} /> Create your first ticket
                </Link>
              }
            />
          )}
          {!recent.loading && recent.data?.data?.length > 0 && (
            <div className="grid grid--2">
              {recent.data.data.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
