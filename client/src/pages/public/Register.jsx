import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CloudCog, Mail, Lock, User, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const rules = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'Contains a letter', test: (v) => /[a-zA-Z]/.test(v) },
  { label: 'Contains a number', test: (v) => /[0-9]/.test(v) },
];

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors([]);

    if (form.password !== form.confirm) {
      setError('The two passwords do not match.');
      return;
    }
    if (!rules.every((r) => r.test(form.password))) {
      setError('Your password does not meet the requirements below.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await register({ name: form.name, email: form.email, password: form.password });
      toast.success('Account created', `Welcome to CloudDesk, ${user.name.split(' ')[0]}.`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.details || []);
    } finally {
      setSubmitting(false);
    }
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
        <h2>Raise a ticket, get a real answer.</h2>
        <p>
          New accounts join as customers. Support agent and administrator accounts are created by an administrator from
          the user management screen.
        </p>
      </aside>

      <main className="auth-layout__main">
        <div className="auth-card">
          <div className="auth-card__head">
            <h1>Create your account</h1>
            <p>It takes less than a minute.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="alert alert--danger mb-4" role="alert">
                <div>
                  {error}
                  {fieldErrors.length > 0 && (
                    <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                      {fieldErrors.map((d) => (
                        <li key={d.field}>{d.message}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <div className="field">
              <label className="field__label" htmlFor="name">
                Full name
              </label>
              <div className="input-group">
                <User size={16} className="input-group__icon" />
                <input
                  id="name"
                  name="name"
                  className="input"
                  placeholder="Aarav Sharma"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

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
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="mt-2 stack gap-1">
                {rules.map((rule) => {
                  const passed = rule.test(form.password);
                  return (
                    <span
                      key={rule.label}
                      className="text-xs row gap-2"
                      style={{ color: passed ? 'var(--success)' : 'var(--text-subtle)' }}
                    >
                      <CheckCircle2 size={13} /> {rule.label}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="confirm">
                Confirm password
              </label>
              <div className="input-group">
                <Lock size={16} className="input-group__icon" />
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  className="input"
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={submitting}>
              {submitting ? <span className="spinner" style={{ width: 15, height: 15 }} /> : <UserPlus size={17} />}
              Create account
            </button>
          </form>

          <p className="text-sm text-muted mt-4" style={{ textAlign: 'center' }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
