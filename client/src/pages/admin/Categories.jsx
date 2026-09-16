import { useCallback, useEffect, useState } from 'react';
import { FolderPlus, Pencil, Trash2, Tags } from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import Modal, { ConfirmDialog } from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Loading, ErrorState, EmptyState } from '../../components/ui/States';

const emptyForm = { name: '', description: '', color: '#6366f1' };

export default function Categories() {
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState([]);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.categories({ includeInactive: true });
      setCategories(res.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormErrors([]);
    setEditing({ mode: 'create' });
  };

  const openEdit = (category) => {
    setForm({
      name: category.name,
      description: category.description || '',
      color: category.color || '#6366f1',
    });
    setFormErrors([]);
    setEditing({ mode: 'edit', category });
  };

  const change = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const save = async () => {
    setSaving(true);
    setFormErrors([]);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      color: form.color,
    };
    try {
      if (editing.mode === 'create') {
        await adminApi.createCategory(payload);
        toast.success('Category created', payload.name);
      } else {
        await adminApi.updateCategory(editing.category.id, payload);
        toast.success('Category updated', payload.name);
      }
      setEditing(null);
      load();
    } catch (err) {
      setFormErrors(err.details || [{ field: 'form', message: err.message }]);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (category) => {
    try {
      await adminApi.updateCategory(category.id, { isActive: !category.isActive });
      load();
    } catch (err) {
      toast.error('Could not update category', err.message);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await adminApi.deleteCategory(toDelete.id);
      toast.success('Category deleted', toDelete.name);
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
          <h1>Categories</h1>
          <p className="page-header__sub">Categories drive routing, filtering and the AI classifier vocabulary.</p>
        </div>
        <button className="btn btn--primary" onClick={openCreate}>
          <FolderPlus size={16} /> New category
        </button>
      </div>

      <section className="card">
        <div className="card__body card__body--tight">
          {loading && <Loading label="Loading categories…" />}
          {!loading && error && <ErrorState message={error.message} onRetry={load} />}
          {!loading && !error && categories.length === 0 && (
            <EmptyState icon={Tags} title="No categories yet" message="Create your first category to start routing tickets." />
          )}

          {!loading && !error && categories.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Tickets</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td>
                        <div className="row gap-2">
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: category.color,
                              flexShrink: 0,
                            }}
                          />
                          <span className="table__cell-strong">{category.name}</span>
                        </div>
                        <div className="text-xs text-subtle mono">{category.slug}</div>
                      </td>
                      <td className="text-muted">{category.description || '—'}</td>
                      <td>{category._count?.tickets ?? 0}</td>
                      <td>
                        <Badge tone={category.isActive ? 'success' : 'neutral'} dot>
                          {category.isActive ? 'Active' : 'Hidden'}
                        </Badge>
                      </td>
                      <td>
                        <div className="table__actions">
                          <button className="btn btn--ghost btn--sm" onClick={() => openEdit(category)}>
                            <Pencil size={14} /> Edit
                          </button>
                          <button className="btn btn--ghost btn--sm" onClick={() => toggleActive(category)}>
                            {category.isActive ? 'Hide' : 'Show'}
                          </button>
                          <button className="btn btn--ghost btn--sm text-danger" onClick={() => setToDelete(category)}>
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
      </section>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.mode === 'create' ? 'Create category' : 'Edit category'}
        footer={
          <>
            <button className="btn btn--secondary" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn--primary" onClick={save} disabled={saving}>
              {saving && <span className="spinner" style={{ width: 14, height: 14 }} />}
              Save
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
            <label className="field__label" htmlFor="cat-name">
              Name
            </label>
            <input id="cat-name" className="input" value={form.name} onChange={change('name')} />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="cat-desc">
              Description
            </label>
            <textarea id="cat-desc" className="textarea" rows={3} value={form.description} onChange={change('description')} />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="cat-color">
              Colour
            </label>
            <div className="row gap-3">
              <input
                id="cat-color"
                type="color"
                className="input"
                style={{ width: 64, padding: 4 }}
                value={form.color}
                onChange={change('color')}
              />
              <input className="input" value={form.color} onChange={change('color')} />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        busy={deleting}
        danger
        title="Delete category?"
        confirmLabel="Delete category"
        message={`Tickets in “${toDelete?.name}” will become uncategorised.`}
      />
    </div>
  );
}
