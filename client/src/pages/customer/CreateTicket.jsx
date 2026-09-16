import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Info, ArrowLeft, Paperclip } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { categoryApi, ticketApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { formatBytes } from '../../utils/format';

const MAX_MB = 5;
const ACCEPT = 'image/png,image/jpeg,application/pdf';

export default function CreateTicket() {
  const navigate = useNavigate();
  const toast = useToast();
  const categories = useApi(() => categoryApi.list(), []);

  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', categoryId: '' });
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleFile = (e) => {
    const selected = e.target.files?.[0];
    setFileError('');
    if (!selected) {
      setFile(null);
      return;
    }
    if (!ACCEPT.split(',').includes(selected.type)) {
      setFileError('Only PNG, JPG and PDF files are accepted.');
      setFile(null);
      return;
    }
    if (selected.size > MAX_MB * 1024 * 1024) {
      setFileError(`File must be ${MAX_MB}MB or smaller.`);
      setFile(null);
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors([]);
    setSubmitting(true);

    try {
      const payload = { ...form };
      if (!payload.categoryId) delete payload.categoryId;

      const res = await ticketApi.create(payload);
      const ticket = res.data;

      if (file) {
        try {
          await ticketApi.uploadAttachment(ticket.id, file);
        } catch (uploadErr) {
          // The ticket exists; only the attachment failed, so say so clearly.
          toast.warning('Ticket created, attachment failed', uploadErr.message);
        }
      }

      toast.success('Ticket submitted', `Reference ${ticket.reference}. Our team will respond shortly.`);
      navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.details || []);
    } finally {
      setSubmitting(false);
    }
  };

  const errorFor = (field) => fieldErrors.find((d) => d.field === field)?.message;

  return (
    <>
      <div className="page-header">
        <div>
          <button className="btn btn--ghost btn--sm mb-3" onClick={() => navigate(-1)}>
            <ArrowLeft size={15} /> Back
          </button>
          <h1>Create a support ticket</h1>
          <p className="page-header__sub">Tell us what happened. The more detail you give, the faster we can help.</p>
        </div>
      </div>

      <div className="grid grid--detail">
        <section className="card">
          <div className="card__body">
            <form onSubmit={handleSubmit} noValidate>
              {error && (
                <div className="alert alert--danger mb-4" role="alert">
                  {error}
                </div>
              )}

              <div className="field">
                <label className="field__label" htmlFor="title">
                  Subject
                </label>
                <input
                  id="title"
                  name="title"
                  className="input"
                  placeholder="e.g. Payment deducted but order shows Payment Failed"
                  value={form.title}
                  onChange={handleChange}
                  aria-invalid={Boolean(errorFor('title'))}
                  maxLength={150}
                  required
                />
                {errorFor('title') && <div className="field__error">{errorFor('title')}</div>}
              </div>

              <div className="field">
                <label className="field__label" htmlFor="description">
                  What happened?
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="textarea"
                  rows={9}
                  placeholder="Include the order or transaction reference, when it happened, what you expected and what you saw instead."
                  value={form.description}
                  onChange={handleChange}
                  aria-invalid={Boolean(errorFor('description'))}
                  maxLength={8000}
                  required
                />
                <div className="field__hint">{form.description.length} / 8000 characters</div>
                {errorFor('description') && <div className="field__error">{errorFor('description')}</div>}
              </div>

              <div className="grid grid--2">
                <div className="field">
                  <label className="field__label" htmlFor="categoryId">
                    Category
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    className="select"
                    value={form.categoryId}
                    onChange={handleChange}
                    disabled={categories.loading}
                  >
                    <option value="">Let CloudDesk decide</option>
                    {categories.data?.data?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="field__hint">Optional — the AI analysis can classify it for you.</div>
                </div>

                <div className="field">
                  <label className="field__label" htmlFor="priority">
                    How urgent is it?
                  </label>
                  <select id="priority" name="priority" className="select" value={form.priority} onChange={handleChange}>
                    <option value="LOW">Low — a question, no rush</option>
                    <option value="MEDIUM">Medium — I need help soon</option>
                    <option value="HIGH">High — it is blocking me</option>
                    <option value="URGENT">Urgent — money or data is affected</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="attachment">
                  Attachment (optional)
                </label>
                <input id="attachment" type="file" className="input" accept={ACCEPT} onChange={handleFile} />
                <div className="field__hint">PNG, JPG or PDF · up to {MAX_MB}MB</div>
                {file && (
                  <div className="text-sm text-success mt-2 row gap-2">
                    <Paperclip size={14} /> {file.name} ({formatBytes(file.size)})
                  </div>
                )}
                {fileError && <div className="field__error">{fileError}</div>}
              </div>

              <div className="row gap-3 mt-5">
                <button className="btn btn--primary" type="submit" disabled={submitting}>
                  {submitting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Send size={16} />}
                  Submit ticket
                </button>
                <button className="btn btn--secondary" type="button" onClick={() => navigate('/tickets')} disabled={submitting}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </section>

        <aside className="card">
          <div className="card__header">
            <div className="row gap-2">
              <Info size={16} style={{ color: 'var(--primary)' }} />
              <span className="card__title">Getting a fast answer</span>
            </div>
          </div>
          <div className="card__body">
            <ul className="ai-panel__list">
              <li>Include the order, invoice or transaction reference.</li>
              <li>Say exactly when the problem happened.</li>
              <li>Describe what you expected versus what actually happened.</li>
              <li>Attach a screenshot or receipt where you can.</li>
              <li>Mention your device, browser or app version for technical issues.</li>
            </ul>
            <div className="alert alert--info mt-4">
              <Info size={16} style={{ flexShrink: 0 }} />
              <div>You will get a reference number as soon as you submit, and a notification on every update.</div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
