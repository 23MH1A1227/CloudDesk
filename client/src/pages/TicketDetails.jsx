import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Paperclip,
  Send,
  Upload,
  UserCheck,
  Trash2,
  FileText,
  Download,
  Lock,
  Star,
} from 'lucide-react';
import { ticketApi, categoryApi, adminApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationContext';
import Conversation from '../components/tickets/Conversation';
import AIAnalysisPanel from '../components/tickets/AIAnalysisPanel';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/ui/Badge';
import { UserCell } from '../components/ui/Avatar';
import { Loading, ErrorState } from '../components/ui/States';
import { ConfirmDialog } from '../components/ui/Modal';
import { STATUS_LABELS, PRIORITY_LABELS, formatDateTime, formatBytes } from '../utils/format';

const STATUSES = Object.keys(STATUS_LABELS);
const PRIORITIES = Object.keys(PRIORITY_LABELS);

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isCustomer, isStaff, isAdmin } = useAuth();
  const { refresh: refreshNotifications } = useNotifications();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [categories, setCategories] = useState([]);
  const [agents, setAgents] = useState([]);

  const [analysis, setAnalysis] = useState(null);
  const [analysing, setAnalysing] = useState(false);

  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const fileInput = useRef(null);

  const [updating, setUpdating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ticketApi.get(id);
      setTicket(res.data);
      setAnalysis(res.data.aiAnalyses?.[0] || null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Staff need category + agent lists to reclassify and assign tickets.
  useEffect(() => {
    if (!isStaff) return;
    categoryApi
      .list()
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
    adminApi
      .agents()
      .then((res) => setAgents(res.data))
      .catch(() => setAgents([]));
  }, [isStaff]);

  const patch = async (payload, successMessage) => {
    setUpdating(true);
    try {
      const res = await ticketApi.update(id, payload);
      setTicket((current) => ({ ...current, ...res.data }));
      toast.success('Ticket updated', successMessage);
      refreshNotifications();
    } catch (err) {
      toast.error('Update failed', err.message);
    } finally {
      setUpdating(false);
    }
  };

  const submitReply = async (event) => {
    event.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await ticketApi.sendMessage(id, { body: reply.trim(), isInternal: internal });
      setTicket((current) => ({ ...current, messages: [...current.messages, res.data] }));
      setReply('');
      setInternal(false);
      toast.success('Message sent', internal ? 'Internal note added.' : 'Your reply was posted to the ticket.');
    } catch (err) {
      toast.error('Could not send message', err.message);
    } finally {
      setSending(false);
    }
  };

  const onFileChosen = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadPct(0);
    try {
      const res = await ticketApi.uploadAttachment(id, file, setUploadPct);
      setTicket((current) => ({ ...current, attachments: [res.data, ...(current.attachments || [])] }));
      toast.success('File uploaded', `${res.data.originalName} attached to this ticket.`);
    } catch (err) {
      toast.error('Upload failed', err.message);
    } finally {
      setUploading(false);
      setUploadPct(0);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const runAnalysis = async () => {
    setAnalysing(true);
    try {
      const res = await ticketApi.analyze(id);
      setAnalysis(res.data);
      if (res.data.available) toast.success('Analysis complete', 'Gemini returned a fresh analysis.');
      else toast.warning('AI unavailable', 'Showing the deterministic fallback analysis instead.');
    } catch (err) {
      toast.error('Analysis failed', err.message);
    } finally {
      setAnalysing(false);
    }
  };

  const removeTicket = async () => {
    setDeleting(true);
    try {
      await ticketApi.remove(id);
      toast.success('Ticket deleted', 'The ticket and its history were removed.');
      navigate('/tickets');
    } catch (err) {
      toast.error('Delete failed', err.message);
      setDeleting(false);
    }
  };

  const rate = async (score) => patch({ satisfaction: score }, `You rated this ticket ${score}/5.`);

  const canAnalyze = isStaff;
  const attachments = ticket?.attachments || [];

  const closed = useMemo(() => ticket && ['RESOLVED', 'CLOSED'].includes(ticket.status), [ticket]);

  if (loading) return <Loading label="Loading ticket…" full />;
  if (error) {
    return (
      <ErrorState
        title="Ticket unavailable"
        message={error.message || 'We could not load this ticket.'}
        onRetry={load}
      />
    );
  }
  if (!ticket) return null;

  return (
    <div className="stack">
      <div className="row between wrap gap-3">
        <Link to="/tickets" className="btn btn--ghost btn--sm">
          <ArrowLeft size={15} /> Back to tickets
        </Link>
        {isAdmin && (
          <button className="btn btn--danger btn--sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={15} /> Delete ticket
          </button>
        )}
      </div>

      <div className="grid grid--detail">
        <div className="stack">
          <section className="card">
            <div className="card__body">
              <div className="row between wrap gap-3 mb-3">
                <span className="ticket-card__ref mono">{ticket.reference}</span>
                <div className="row gap-2 wrap">
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                  <CategoryBadge category={ticket.category} />
                </div>
              </div>
              <h2 style={{ fontSize: '1.3rem', marginBottom: 'var(--space-3)' }}>{ticket.title}</h2>
              <div className="detail-list">
                <div className="detail-row">
                  <span className="detail-row__label">Customer</span>
                  <span className="detail-row__value">
                    <UserCell user={ticket.customer} />
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-row__label">Assigned to</span>
                  <span className="detail-row__value">
                    <UserCell user={ticket.assignee} />
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-row__label">Created</span>
                  <span className="detail-row__value">{formatDateTime(ticket.createdAt)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-row__label">Last updated</span>
                  <span className="detail-row__value">{formatDateTime(ticket.updatedAt)}</span>
                </div>
                {ticket.resolvedAt && (
                  <div className="detail-row">
                    <span className="detail-row__label">Resolved</span>
                    <span className="detail-row__value">{formatDateTime(ticket.resolvedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card__header">
              <span className="card__title">Conversation</span>
              <span className="text-sm text-muted">{ticket.messages.length} message(s)</span>
            </div>
            <div className="card__body">
              <Conversation
                messages={ticket.messages}
                currentUserId={user.id}
                description={ticket.description}
                customer={ticket.customer}
                createdAt={ticket.createdAt}
              />

              <form onSubmit={submitReply} className="stack mt-4">
                <div className="field">
                  <label className="field__label" htmlFor="reply">
                    {isStaff ? 'Reply to customer' : 'Add a message'}
                  </label>
                  <textarea
                    id="reply"
                    className="textarea"
                    rows={4}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={isStaff ? 'Write your response…' : 'Add more detail or ask for an update…'}
                  />
                </div>
                <div className="row between wrap gap-3">
                  {isStaff ? (
                    <label className="row gap-2 text-sm text-muted" style={{ cursor: 'pointer' }}>
                      <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                      <Lock size={13} /> Internal note (hidden from the customer)
                    </label>
                  ) : (
                    <span className="text-sm text-muted">Support usually replies within one business day.</span>
                  )}
                  <button className="btn btn--primary" type="submit" disabled={sending || !reply.trim()}>
                    {sending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Send size={15} />}
                    Send
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="card">
            <div className="card__header">
              <div className="row gap-2">
                <Paperclip size={16} />
                <span className="card__title">Attachments</span>
              </div>
              <div className="row gap-2">
                <input
                  ref={fileInput}
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={onFileChosen}
                  style={{ display: 'none' }}
                />
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <span className="spinner" style={{ width: 13, height: 13 }} /> : <Upload size={14} />}
                  {uploading ? `Uploading ${uploadPct}%` : 'Upload attachment'}
                </button>
              </div>
            </div>
            <div className="card__body">
              {attachments.length === 0 ? (
                <p className="text-sm text-muted">
                  No files attached yet. PNG, JPG and PDF files are accepted.
                </p>
              ) : (
                <div className="stack">
                  {attachments.map((file) => (
                    <a
                      key={file.id}
                      className="attachment"
                      href={file.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      download
                    >
                      <FileText size={18} />
                      <div style={{ minWidth: 0 }}>
                        <div className="attachment__name truncate">{file.originalName}</div>
                        <div className="attachment__meta">
                          {formatBytes(file.size)} · {file.uploadedBy?.name} · {formatDateTime(file.createdAt)}
                        </div>
                      </div>
                      <Download size={16} className="ml-auto" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="stack">
          {isStaff && (
            <section className="card">
              <div className="card__header">
                <span className="card__title">Ticket controls</span>
              </div>
              <div className="card__body stack">
                <div className="field">
                  <label className="field__label" htmlFor="status">
                    Status
                  </label>
                  <select
                    id="status"
                    className="select"
                    value={ticket.status}
                    disabled={updating}
                    onChange={(e) => patch({ status: e.target.value }, `Status set to ${STATUS_LABELS[e.target.value]}.`)}
                  >
                    {STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {STATUS_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="field__label" htmlFor="priority">
                    Priority
                  </label>
                  <select
                    id="priority"
                    className="select"
                    value={ticket.priority}
                    disabled={updating}
                    onChange={(e) =>
                      patch({ priority: e.target.value }, `Priority set to ${PRIORITY_LABELS[e.target.value]}.`)
                    }
                  >
                    {PRIORITIES.map((value) => (
                      <option key={value} value={value}>
                        {PRIORITY_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="field__label" htmlFor="category">
                    Category
                  </label>
                  <select
                    id="category"
                    className="select"
                    value={ticket.categoryId || ''}
                    disabled={updating}
                    onChange={(e) => patch({ categoryId: e.target.value || null }, 'Category updated.')}
                  >
                    <option value="">Uncategorised</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="field__label" htmlFor="assignee">
                    Assignee
                  </label>
                  <select
                    id="assignee"
                    className="select"
                    value={ticket.assigneeId || ''}
                    disabled={updating}
                    onChange={(e) => patch({ assigneeId: e.target.value || null }, 'Assignment updated.')}
                  >
                    <option value="">Unassigned</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>

                {ticket.assigneeId !== user.id && (
                  <button
                    className="btn btn--secondary btn--block"
                    disabled={updating}
                    onClick={() => patch({ assigneeId: user.id }, 'This ticket is now assigned to you.')}
                  >
                    <UserCheck size={15} /> Assign to me
                  </button>
                )}
              </div>
            </section>
          )}

          {isCustomer && closed && (
            <section className="card">
              <div className="card__header">
                <span className="card__title">Rate this resolution</span>
              </div>
              <div className="card__body">
                <p className="text-sm text-muted mb-3">
                  {ticket.satisfaction
                    ? `You rated this ticket ${ticket.satisfaction}/5. Thanks for the feedback.`
                    : 'How happy are you with how this ticket was handled?'}
                </p>
                <div className="row gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      className="icon-btn"
                      aria-label={`Rate ${score} out of 5`}
                      disabled={updating}
                      onClick={() => rate(score)}
                    >
                      <Star
                        size={18}
                        fill={ticket.satisfaction >= score ? 'currentColor' : 'none'}
                        style={{ color: ticket.satisfaction >= score ? 'var(--warning)' : 'var(--text-subtle)' }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          <AIAnalysisPanel
            analysis={analysis}
            loading={analysing}
            onAnalyze={runAnalysis}
            canAnalyze={canAnalyze}
            onUseResponse={isStaff ? (text) => setReply(text) : undefined}
          />
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={removeTicket}
        busy={deleting}
        danger
        title="Delete this ticket?"
        confirmLabel="Delete ticket"
        message="This permanently removes the ticket, its messages, attachments and AI analyses. This cannot be undone."
      />
    </div>
  );
}
