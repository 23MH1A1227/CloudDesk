export default function StatCard({ icon: Icon, label, value, hint, tone = 'primary' }) {
  const toneStyles = {
    primary: { background: 'var(--primary-soft)', color: 'var(--primary)' },
    success: { background: 'var(--success-soft)', color: 'var(--success)' },
    warning: { background: 'var(--warning-soft)', color: 'var(--warning)' },
    danger: { background: 'var(--danger-soft)', color: 'var(--danger)' },
    info: { background: 'var(--info-soft)', color: 'var(--info)' },
  };

  return (
    <div className="card stat-card">
      {Icon && (
        <div className="stat-card__icon" style={toneStyles[tone]}>
          <Icon size={20} />
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div className="stat-card__label">{label}</div>
        <div className="stat-card__value">{value}</div>
        {hint && <div className="stat-card__hint">{hint}</div>}
      </div>
    </div>
  );
}
