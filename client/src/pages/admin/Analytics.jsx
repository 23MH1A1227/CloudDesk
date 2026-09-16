import { Activity, Cpu, Database, HardDrive } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { adminApi } from '../../api/endpoints';
import StatCard from '../../components/ui/StatCard';
import { Loading, ErrorState } from '../../components/ui/States';
import {
  StatusDonut,
  PriorityBar,
  CategoryBar,
  TicketsOverTime,
  WorkloadBar,
} from '../../components/charts/Charts';
import { SentimentBadge } from '../../components/ui/Badge';
import { formatHours } from '../../utils/format';

export default function Analytics() {
  const analytics = useApi(() => adminApi.analytics(), []);
  const system = useApi(() => adminApi.system(), []);

  if (analytics.loading && !analytics.data) return <Loading label="Crunching analytics…" full />;
  if (analytics.error) return <ErrorState message={analytics.error.message} onRetry={analytics.refetch} />;

  const { cards = {}, charts = {}, users = {} } = analytics.data?.data ?? {};
  const { records = {}, runtime = {} } = system.data?.data ?? {};
  const sentiment = charts.sentiment || [];
  const totalSentiment = sentiment.reduce((sum, row) => sum + row.value, 0);

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p className="page-header__sub">Every figure below is computed from live database records.</p>
        </div>
      </div>

      <div className="grid grid--stats">
        <StatCard icon={Activity} label="Total tickets" value={cards.totalTickets ?? 0} tone="primary" />
        <StatCard
          icon={Activity}
          label="Resolution rate"
          value={
            cards.totalTickets
              ? `${Math.round(((cards.resolvedTickets ?? 0) / cards.totalTickets) * 100)}%`
              : '—'
          }
          tone="success"
        />
        <StatCard
          icon={Activity}
          label="Avg. first response"
          value={formatHours(cards.averageResponseHours)}
          tone="warning"
        />
        <StatCard
          icon={Activity}
          label="Satisfaction"
          value={cards.satisfaction?.average ? `${cards.satisfaction.average}/5` : '—'}
          hint={`${cards.satisfaction?.responses ?? 0} rating(s)`}
          tone="info"
        />
        <StatCard
          icon={Activity}
          label="Active users"
          value={users.active ?? 0}
          hint={`${users.total ?? 0} total accounts`}
          tone="primary"
        />
      </div>

      <div className="grid grid--2">
        <section className="card">
          <div className="card__header">
            <span className="card__title">Tickets over time</span>
          </div>
          <div className="card__body">
            <TicketsOverTime data={charts.overTime} />
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <span className="card__title">Tickets by status</span>
          </div>
          <div className="card__body">
            <StatusDonut data={charts.byStatus} />
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <span className="card__title">Tickets by category</span>
          </div>
          <div className="card__body">
            <CategoryBar data={charts.byCategory} />
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <span className="card__title">Priority distribution</span>
          </div>
          <div className="card__body">
            <PriorityBar data={charts.byPriority} />
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <span className="card__title">Agent workload</span>
          </div>
          <div className="card__body">
            <WorkloadBar data={charts.agentWorkload} />
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <span className="card__title">AI sentiment mix</span>
          </div>
          <div className="card__body">
            {totalSentiment === 0 ? (
              <p className="text-sm text-muted">Run AI analysis on tickets to populate sentiment data.</p>
            ) : (
              <div className="detail-list">
                {sentiment.map((row) => (
                  <div className="detail-row" key={row.name}>
                    <span className="detail-row__label">
                      <SentimentBadge sentiment={row.name} />
                    </span>
                    <span className="detail-row__value">
                      {row.value} ({Math.round((row.value / totalSentiment) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card__header">
          <div className="row gap-2">
            <Database size={16} />
            <span className="card__title">System statistics</span>
          </div>
        </div>
        <div className="card__body">
          {system.loading && !system.data && <Loading label="Reading system stats…" />}
          {system.error && <ErrorState message={system.error.message} onRetry={system.refetch} />}
          {system.data && (
            <div className="grid grid--stats">
              <StatCard icon={HardDrive} label="Tickets stored" value={records.tickets ?? 0} tone="primary" />
              <StatCard icon={HardDrive} label="Messages" value={records.messages ?? 0} tone="info" />
              <StatCard icon={HardDrive} label="Attachments" value={records.attachments ?? 0} tone="warning" />
              <StatCard icon={HardDrive} label="AI analyses" value={records.analyses ?? 0} tone="success" />
              <StatCard icon={HardDrive} label="Audit entries" value={records.auditLogs ?? 0} tone="danger" />
              <StatCard
                icon={Cpu}
                label="API runtime"
                value={runtime.nodeVersion || '—'}
                hint={`${runtime.memoryMb ?? 0} MB RSS · up ${Math.round((runtime.uptimeSeconds ?? 0) / 60)} min`}
                tone="primary"
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
