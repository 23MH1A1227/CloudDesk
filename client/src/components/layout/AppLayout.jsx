import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const TITLES = [
  [/^\/dashboard/, 'Dashboard'],
  [/^\/tickets\/new/, 'Create ticket'],
  [/^\/tickets\/[^/]+$/, 'Ticket details'],
  [/^\/tickets/, 'Tickets'],
  [/^\/notifications/, 'Notifications'],
  [/^\/profile/, 'Profile'],
  [/^\/admin\/users/, 'User management'],
  [/^\/admin\/tickets/, 'Ticket management'],
  [/^\/admin\/analytics/, 'Analytics'],
  [/^\/admin\/audit-logs/, 'Audit logs'],
  [/^\/admin\/categories/, 'Categories'],
];

const titleFor = (pathname) => TITLES.find(([re]) => re.test(pathname))?.[1] || 'CloudDesk';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.title = `${titleFor(location.pathname)} · CloudDesk`;
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main">
        <Topbar title={titleFor(location.pathname)} onMenuClick={() => setSidebarOpen((o) => !o)} />
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
