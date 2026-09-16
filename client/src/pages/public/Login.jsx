import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CloudCog, Mail, Lock, LogIn, Sparkles, ShieldCheck, BarChart3, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const DEMO_ACCOUNTS = [
  { role: 'Customer', email: 'customer@clouddesk.dev', password: 'Customer@123' },
  { role: 'Support agent', email: 'agent@clouddesk.dev', password: 'Agent@123' },
  { role: 'Administrator', email: 'admin@clouddesk.dev', password: 'Admin@123' },
];

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (account) => {
    setForm({ email: account.email, password: account.password });
    setError('');
  };

  return (
    <div className="auth-layout">
      <aside className="auth-layout__aside">
        <div className="landing__brand" style={{ color: '#fff' }}>
          <span className="sidebar__logo" style={{ background: 'rgba(255,255,255,0.18)' }}>
            <CloudCog size={18} />
          </span>
          CloudDesk
        </div>
        <h2>Support that understands the problem before you do.</h2>
        <div className="auth-layout__points">
          <div className="auth-layout__point">
            <Sparkles size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            AI summaries, sentiment and drafted replies on every ticket.
          </div>
          <div className="auth-layout__point">
            <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            Role-based access for customers, agents and administrators.
          </div>
          <div className="auth-layout__point">
            <BarChart3 size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            Live dashboards computed from your real ticket data.
          </div>
        </div>
      </aside>

      <main className="auth-layout__main">
        <div className="auth-card">
          <div className="auth-card__head">
            <h1>Sign in</h1>
            <p>Welcome back. Enter your credentials to continue.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="alert alert--danger mb-4" role="alert">
                {error}
              </div>
            )}

            <div className="field">
              <label className="field__label" htmlFor="email">
                Email address
              </label>
              <div className="input-group">
                <Mail size={16} className="input-group__icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="input"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="password">
                Password
              </label>
              <div className="input-group">
                <Lock size={16} className="input-group__icon" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="input"
                  placeholder="Your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={submitting}>
              {submitting ? <span className="spinner" style={{ width: 15, height: 15 }} /> : <LogIn size={17} />}
              Sign in
            </button>
          </form>

          <p className="text-sm text-muted mt-4" style={{ textAlign: 'center' }}>
            No account yet? <Link to="/register">Create one</Link>
          </p>

          <div className="demo-creds">
            <div className="demo-creds__title">
              <KeyRound size={14} /> Development seed accounts
            </div>
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                className="demo-creds__row"
                style={{ width: '100%', background: 'none', border: 'none' }}
                onClick={() => fillDemo(a)}
                title="Click to fill the form"
              >
                <span>{a.role}</span>
                <span>{a.email}</span>
              </button>
            ))}
            <p className="text-xs text-subtle mt-2" style={{ fontFamily: 'var(--font-sans)' }}>
              Available only after running the seed script. Development use only.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
