import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Bell,
  User,
  Users,
  BarChart3,
  ScrollText,
  Tags,
  ShieldCheck,
  CloudCog,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { ROLE_LABELS } from '../../utils/format';
import Avatar from '../ui/Avatar';

const navFor = (role) => {
  const common = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/tickets', label: 'Tickets', icon: Ticket },
  ];

  if (role === 'CUSTOMER') {
    return [
      {
        group: 'Support',
        links: [
          ...common,
          { to: '/tickets/new', label: 'New ticket', icon: PlusCircle },
        ],
      },
      {
        group: 'Account',
        links: [
          { to: '/notifications', label: 'Notifications', icon: Bell, badge: true },
          { to: '/profile', label: 'Profile', icon: User },
        ],
      },
    ];
  }

  if (role === 'SUPPORT_AGENT') {
    return [
      {
        group: 'Workspace',
        links: [
          ...common,
          { to: '/tickets?scope=mine', label: 'Assigned to me', icon: ShieldCheck },
        ],
      },
      {
        group: 'Account',
        links: [
          { to: '/notifications', label: 'Notifications', icon: Bell, badge: true },
          { to: '/profile', label: 'Profile', icon: User },
        ],
      },
    ];
  }

  return [
    { group: 'Workspace', links: common },
    {
      group: 'Administration',
      links: [
        { to: '/admin/tickets', label: 'Ticket management', icon: Ticket },
        { to: '/admin/users', label: 'Users', icon: Users },
        { to: '/admin/categories', label: 'Categories', icon: Tags },
        { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
        { to: '/admin/audit-logs', label: 'Audit logs', icon: ScrollText },
      ],
    },
    {
      group: 'Account',
      links: [
        { to: '/notifications', label: 'Notifications', icon: Bell, badge: true },
        { to: '/profile', label: 'Profile', icon: User },
      ],
    },
  ];
};

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const groups = navFor(user?.role);

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar__brand">
          <span className="sidebar__logo">
            <CloudCog size={18} />
          </span>
          CloudDesk
          <button className="icon-btn sidebar__close ml-auto" onClick={onClose} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {groups.map((group) => (
            <div key={group.group}>
              <div className="sidebar__group-label">{group.group}</div>
              {group.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={onClose}
                  className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                >
                  <link.icon size={17} />
                  {link.label}
                  {link.badge && unreadCount > 0 && (
                    <span className="nav-link__badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="user-cell">
            <Avatar user={user} size="md" />
            <div style={{ minWidth: 0 }}>
              <div className="user-cell__name">{user?.name}</div>
              <div className="user-cell__email">{ROLE_LABELS[user?.role]}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
