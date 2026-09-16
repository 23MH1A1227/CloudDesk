import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { CHART_COLORS, STATUS_LABELS, PRIORITY_LABELS } from '../../utils/format';
import { EmptyState } from '../ui/States';
import { BarChart3 } from 'lucide-react';

const axisStyle = { fontSize: 11, fill: 'var(--text-subtle)' };

const tooltipStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  fontSize: 12,
  color: 'var(--text)',
  boxShadow: 'var(--shadow)',
};

const hasData = (data) => Array.isArray(data) && data.some((d) => (d.value ?? d.created ?? 0) > 0);

const NoData = ({ message }) => (
  <div className="chart-box" style={{ display: 'grid', placeItems: 'center' }}>
    <EmptyState icon={BarChart3} title="No data yet" message={message} />
  </div>
);

export function StatusDonut({ data }) {
  if (!hasData(data)) return <NoData message="Ticket status breakdown appears once tickets exist." />;

  const rows = data.filter((d) => d.value > 0).map((d) => ({ ...d, label: STATUS_LABELS[d.name] || d.name }));

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={rows} dataKey="value" nameKey="label" innerRadius="55%" outerRadius="80%" paddingAngle={2} stroke="none">
            {rows.map((entry, i) => (
              <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryBar({ data }) {
  if (!hasData(data)) return <NoData message="Category distribution appears once tickets are categorised." />;

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={130} tick={axisStyle} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--surface-2)' }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PriorityBar({ data }) {
  if (!hasData(data)) return <NoData message="Priority distribution appears once tickets exist." />;

  const colors = { LOW: '#94a3b8', MEDIUM: '#0ea5e9', HIGH: '#f59e0b', URGENT: '#f43f5e' };
  const rows = data.map((d) => ({ ...d, label: PRIORITY_LABELS[d.name] || d.name }));

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ left: -18, right: 12, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--surface-2)' }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={38}>
            {rows.map((entry) => (
              <Cell key={entry.name} fill={colors[entry.name] || CHART_COLORS[0]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TicketsOverTime({ data }) {
  if (!Array.isArray(data) || !data.length) return <NoData message="Ticket volume over time appears once tickets exist." />;

  const rows = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
  }));

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ left: -18, right: 12, top: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} minTickGap={16} />
          <YAxis allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
          <Area type="monotone" dataKey="created" name="Created" stroke="#4f46e5" strokeWidth={2} fill="url(#gradCreated)" />
          <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} fill="url(#gradResolved)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WorkloadBar({ data }) {
  if (!hasData(data)) return <NoData message="Agent workload appears once tickets are assigned." />;

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -18, right: 12, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--surface-2)' }} />
          <Bar dataKey="value" name="Tickets" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={38} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
