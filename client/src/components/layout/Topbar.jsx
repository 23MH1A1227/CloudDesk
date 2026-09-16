import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Menu, Moon, Sun, LogOut, User, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { relativeTime, ROLE_LABELS } from '../../utils/format';
import Avatar from '../ui/Avatar';
import { EmptyState } from '../ui/States';

function useOutsideClose(ref, onClose) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onClose]);
}

export default function Topbar({ title, onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { items, unreadCount, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const notifRef = useRef(null);
  const menuRef = useRef(null);

  useOutsideClose(notifRef, () => setNotifOpen(false));
  useOutsideClose(menuRef, () => setMenuOpen(false));

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) markRead(notification.id);
    setNotifOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="topbar">
      <button className="icon-btn menu-toggle" onClick={onMenuClick} aria-label="Open navigation">
        <Menu size={20} />
      </button>

      <h1 className="topbar__title">{title}</h1>
      <div className="topbar__spacer" />

      <button className="icon-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
        {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
      </button>

      <div className="dropdown" ref={notifRef}>
        <button
          className="icon-btn"
          onClick={() => setNotifOpen((o) => !o)}
          aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
          aria-expanded={notifOpen}
        >
          <Bell size={19} />
          {unreadCount > 0 && <span className="icon-btn__dot">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </button>

        {notifOpen && (
          <div className="dropdown__panel dropdown__panel--wide">
            <div className="dropdown__header">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <button className="btn btn--ghost btn--sm" onClick={markAllRead}>
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
            </div>
            <div className="dropdown__scroll">
              {items.length === 0 ? (
                <EmptyState icon={Bell} title="You're all caught up" message="New activity on your tickets will show up here." />
              ) : (
                items.slice(0, 8).map((n) => (
                  <button
                    key={n.id}
                    className={`notif-item ${n.isRead ? '' : 'notif-item--unread'}`}
                    style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer' }}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div className="notif-item__title">{n.title}</div>
                      <div className="notif-item__body truncate">{n.body}</div>
                      <div className="notif-item__time">{relativeTime(n.createdAt)}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="dropdown__divider" />
            <Link className="dropdown__item" to="/notifications" onClick={() => setNotifOpen(false)}>
              View all notifications
            </Link>
          </div>
        )}
      </div>

      <div className="dropdown" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
          aria-label="Account menu"
          aria-expanded={menuOpen}
        >
          <Avatar user={user} size="md" />
        </button>

        {menuOpen && (
          <div className="dropdown__panel">
            <div className="dropdown__header" style={{ display: 'block' }}>
              <div>{user?.name}</div>
              <div className="text-xs text-subtle" style={{ fontWeight: 400 }}>
                {user?.email}
              </div>
              <div className="text-xs text-subtle" style={{ fontWeight: 400 }}>
                {ROLE_LABELS[user?.role]}
              </div>
            </div>
            <Link className="dropdown__item" to="/profile" onClick={() => setMenuOpen(false)}>
              <User size={16} /> Profile settings
            </Link>
            <div className="dropdown__divider" />
            <button className="dropdown__item dropdown__item--danger" onClick={handleLogout}>
              <LogOut size={16} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
