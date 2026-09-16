import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { notificationApi } from '../api/endpoints';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);
const POLL_INTERVAL = 45000;

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await notificationApi.list({ limit: 15 });
      setItems(res.data);
      setUnreadCount(res.meta?.unreadCount ?? 0);
    } catch {
      // Notifications are non-critical; a failure must not break the page.
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      setUnreadCount(0);
      return undefined;
    }
    refresh();
    const timer = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [isAuthenticated, refresh]);

  const markRead = useCallback(async (id) => {
    setItems((current) => current.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(c - 1, 0));
    try {
      await notificationApi.markRead(id);
    } catch {
      /* optimistic update already applied; next poll reconciles */
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((current) => current.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationApi.markAllRead();
    } catch {
      /* next poll reconciles */
    }
  }, []);

  const value = useMemo(
    () => ({ items, unreadCount, loading, refresh, markRead, markAllRead }),
    [items, unreadCount, loading, refresh, markRead, markAllRead]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
};
