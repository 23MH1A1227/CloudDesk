import { useCallback, useEffect, useState } from 'react';
import { UserPlus, Search, Pencil, Trash2, Users as UsersIcon } from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal, { ConfirmDialog } from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import Badge, { RoleBadge } from '../../components/ui/Badge';
import { UserCell } from '../../components/ui/Avatar';
import { ErrorState, EmptyState, TableSkeleton } from '../../components/ui/States';
import { ROLE_LABELS, formatDate } from '../../utils/format';

const ROLES = Object.keys(ROLE_LABELS);
const emptyForm = { name: '', email: '', password: '', role: 'CUSTOMER' };

export default function Users() {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [editing, setEditing] = useState(null); // null = closed, {} = create
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState([]);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.users({ page, limit: 10, role: role || undefined, search: search || undefined });
      setUsers(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page, role, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormErrors([]);
    setEditing({ mode: 'create' });
  };

  const openEdit = (target) => {
    setForm({ name: target.name, email: target.email, password: '', role: target.role });
    setFormErrors([]);
    setEditing({ mode: 'edit', user: target });
  };

  const change = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const save = async () => {
    setSaving(true);
    setFormErrors([]);
    try {
      if (editing.mode === 'create') {
        await adminApi.createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        });
        toast.success('User created', `${form.name} can now sign in.`);
      } else {
        const payload = { name: form.name.trim(), role: form.role };
        if (form.password) payload.password = form.password;
        await adminApi.updateUser(editing.user.id, payload);
        toast.success('User updated', `${form.name}'s account was saved.`);
      }
      setEditing(null);
      load();
    } catch (err) {
      setFormErrors(err.details || [{ field: 'form', message: err.message }]);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (target) => {
    try {
      await adminApi.updateUser(target.id, { isActive: !target.isActive });
      toast.success(target.isActive ? 'User deactivated' : 'User activated', target.email);
      load();
    } catch (err) {
      toast.error('Could not update user', err.message);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await adminApi.deleteUser(toDelete.id);
      toast.success('User deleted', toDelete.email);
      setToDelete(null);
      load();
    } catch (err) {
      toast.error('Delete failed', err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p className="page-header__sub">Create accounts, change roles and deactivate access.</p>
        </div>
        <button className="btn btn--primary" onClick={openCreate}>
          <UserPlus size={16} /> New user
        </button>
      </div>

      <section className="card">
        <div className="card__body card__body--tight">
          <div className="filters">
            <div className="input-group">
              <Search size={16} className="input-group__icon" />
              <input
                className="input"
                placeholder="Search by name or email…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <select
              className="select"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All roles</option>
              {ROLES.map((value) => (
                <option key={value} value={value}>
                  {ROLE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          {loading && <TableSkeleton rows={6} cols={5} />}
          {!loading && error && <ErrorState message={error.message} onRetry={load} />}
          {!loading && !error && users.length === 0 && (
            <EmptyState icon={UsersIcon} title="No users found" message="Try a different search or role filter." />
          )}

          {!loading && !error && users.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <UserCell user={item} />
                      </td>
                      <td>
                        <RoleBadge role={item.role} />
                      </td>
                      <td>
                        <Badge tone={item.isActive ? 'success' : 'neutral'} dot>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="text-muted">{formatDate(item.createdAt)}</td>
                      <td>
                        <div className="table__actions">
                          <button className="btn btn--ghost btn--sm" onClick={() => openEdit(item)}>
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            className="btn btn--ghost btn--sm"
                            onClick={() => toggleActive(item)}
                            disabled={item.id === currentUser.id}
                          >
                            {item.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            className="btn btn--ghost btn--sm text-danger"
                            onClick={() => setToDelete(item)}
                            disabled={item.id === currentUser.id}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {meta && <Pagination meta={meta} onChange={setPage} />}
      </section>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.mode === 'create' ? 'Create user' : 'Edit user'}
        footer={
          <>
            <button className="btn btn--secondary" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn--primary" onClick={save} disabled={saving}>
              {saving && <span className="spinner" style={{ width: 14, height: 14 }} />}
              {editing?.mode === 'create' ? 'Create user' : 'Save changes'}
            </button>
          </>
        }
      >
        <div className="stack">
          {formErrors.length > 0 && (
            <div className="alert alert--danger">
              <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                {formErrors.map((d) => (
                  <li key={d.field}>{d.message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="field">
            <label className="field__label" htmlFor="user-name">
              Full name
            </label>
            <input id="user-name" className="input" value={form.name} onChange={change('name')} />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="user-email">
              Email
            </label>
            <input
              id="user-email"
              className="input"
              type="email"
              value={form.email}
              onChange={change('email')}
              disabled={editing?.mode === 'edit'}
            />
            {editing?.mode === 'edit' && <span className="field__hint">Email addresses cannot be changed.</span>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="user-role">
              Role
            </label>
            <select id="user-role" className="select" value={form.role} onChange={change('role')}>
              {ROLES.map((value) => (
                <option key={value} value={value}>
                  {ROLE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="user-password">
              {editing?.mode === 'create' ? 'Temporary password' : 'New password (optional)'}
            </label>
            <input
              id="user-password"
              className="input"
              type="password"
              value={form.password}
              onChange={change('password')}
              autoComplete="new-password"
            />
            <span className="field__hint">At least 8 characters, including a letter and a number.</span>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        busy={deleting}
        danger
        title="Delete user?"
        confirmLabel="Delete user"
        message={`This permanently removes ${toDelete?.email} along with their tickets and messages.`}
      />
    </div>
  );
}
