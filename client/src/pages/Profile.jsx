import { useState } from 'react';
import { Save, Moon, Sun, LogOut } from 'lucide-react';
import { authApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/ui/Avatar';
import { RoleBadge } from '../components/ui/Badge';
import { formatDateTime } from '../utils/format';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [form, setForm] = useState({ name: user?.name || '', avatarUrl: user?.avatarUrl || '' });
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState([]);

  const change = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFieldErrors([]);
    try {
      const res = await authApi.updateMe({
        name: form.name.trim(),
        avatarUrl: form.avatarUrl.trim(),
      });
      setUser(res.data.user);
      toast.success('Profile saved', 'Your details were updated.');
    } catch (err) {
      setFieldErrors(err.details || []);
      toast.error('Could not save profile', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Profile</h1>
          <p className="page-header__sub">Manage your CloudDesk account details and appearance.</p>
        </div>
      </div>

      <div className="grid grid--detail">
        <section className="card">
          <div className="card__header">
            <span className="card__title">Account details</span>
          </div>
          <form className="card__body stack" onSubmit={submit}>
            <div className="row gap-3 items-start">
              <Avatar user={{ ...user, avatarUrl: form.avatarUrl }} size="lg" />
              <div>
                <div className="fw-600">{user.name}</div>
                <div className="text-sm text-muted">{user.email}</div>
                <div className="mt-2">
                  <RoleBadge role={user.role} />
                </div>
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="name">
                Full name
              </label>
              <input id="name" className="input" value={form.name} onChange={change('name')} required minLength={2} />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="avatarUrl">
                Avatar URL
              </label>
              <input
                id="avatarUrl"
                className="input"
                value={form.avatarUrl}
                onChange={change('avatarUrl')}
                placeholder="https://example.com/avatar.png"
              />
              <span className="field__hint">Leave blank to use your initials.</span>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="email">
                Email address
              </label>
              <input id="email" className="input" value={user.email} disabled />
              <span className="field__hint">Contact an administrator to change your email or role.</span>
            </div>

            {fieldErrors.length > 0 && (
              <div className="alert alert--danger">
                <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                  {fieldErrors.map((d) => (
                    <li key={d.field}>{d.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="row between wrap gap-3">
              <span className="text-sm text-muted">Member since {formatDateTime(user.createdAt)}</span>
              <button className="btn btn--primary" type="submit" disabled={saving}>
                {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Save size={15} />}
                Save changes
              </button>
            </div>
          </form>
        </section>

        <div className="stack">
          <section className="card">
            <div className="card__header">
              <span className="card__title">Appearance</span>
            </div>
            <div className="card__body">
              <p className="text-sm text-muted mb-3">
                CloudDesk follows your system preference by default; your choice here is remembered on this device.
              </p>
              <button className="btn btn--secondary btn--block" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                Switch to {theme === 'dark' ? 'light' : 'dark'} mode
              </button>
            </div>
          </section>

          <section className="card">
            <div className="card__header">
              <span className="card__title">Session</span>
            </div>
            <div className="card__body">
              <p className="text-sm text-muted mb-3">
                Signing out clears your JWT from this browser. You will need your password to sign back in.
              </p>
              <button className="btn btn--danger btn--block" onClick={logout}>
                <LogOut size={15} /> Sign out
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
