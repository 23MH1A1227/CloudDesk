import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationApi } from '../api/endpoints';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/ui/Pagination';
import { Loading, ErrorState, EmptyState } from '../components/ui/States';
import { relativeTime, formatDateTime } from '../utils/format';

export default function Notifications() {
  const { refresh } = useNotifications();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationApi.list({ page, limit: 20 });
      setItems(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const markOne = async (notification) => {
    if (notification.isRead) return;
    setItems((current) => current.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
    try {
      await notificationApi.markRead(notification.id);
      refresh();
    } catch {
      /* the next poll reconciles the optimistic update */
    }
  };

  const markAll = async () => {
    try {
      await notificationApi.markAllRead();
      setItems((current) => current.map((n) => ({ ...n, isRead: true })));
      refresh();
      toast.success('All caught up', 'Every notification is marked as read.');
    } catch (err) {
      toast.error('Could not update notifications', err.message);
    }
  };

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p className="page-header__sub">
            {meta?.unreadCount ? `${meta.unreadCount} unread` : 'You are all caught up'}
          </p>
        </div>
        <button className="btn btn--secondary btn--sm" onClick={markAll} disabled={!unread}>
          <CheckCheck size={15} /> Mark all as read
        </button>
      </div>

      <section className="card">
        <div className="card__body card__body--tight">
          {loading && <Loading label="Loading notifications…" />}
          {!loading && error && <ErrorState message={error.message} onRetry={load} />}
          {!loading && !error && items.length === 0 && (
            <EmptyState
              icon={Bell}
              title="No notifications"
              message="Ticket updates, replies and AI analysis results will show up here."
            />
          )}
          {!loading &&
            !error &&
            items.map((notification) => {
              const content = (
                <>
                  <div className="notif-item__title">{notification.title}</div>
                  <div className="notif-item__body">{notification.body}</div>
                  <div className="notif-item__time" title={formatDateTime(notification.createdAt)}>
                    {relativeTime(notification.createdAt)}
                  </div>
                </>
              );

              const className = `notif-item ${notification.isRead ? '' : 'notif-item--unread'}`;

              return notification.link ? (
                <Link
                  key={notification.id}
                  to={notification.link}
                  className={className}
                  onClick={() => markOne(notification)}
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={notification.id}
                  className={className}
                  role="button"
                  tabIndex={0}
                  onClick={() => markOne(notification)}
                  onKeyDown={(e) => e.key === 'Enter' && markOne(notification)}
                >
                  {content}
                </div>
              );
            })}
        </div>
        {meta && meta.totalPages > 1 && <Pagination meta={meta} onChange={setPage} />}
      </section>
    </div>
  );
}
