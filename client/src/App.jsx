import { Routes, Route, Navigate } from 'react-router-dom';

import AppLayout from './components/layout/AppLayout';
import ProtectedRoute, { PublicOnlyRoute } from './components/layout/ProtectedRoute';

import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import NotFound from './pages/public/NotFound';

import DashboardRouter from './pages/DashboardRouter';
import TicketList from './pages/TicketList';
import TicketDetails from './pages/TicketDetails';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import CreateTicket from './pages/customer/CreateTicket';

import AdminUsers from './pages/admin/Users';
import AdminAnalytics from './pages/admin/Analytics';
import AdminAuditLogs from './pages/admin/AuditLogs';
import AdminCategories from './pages/admin/Categories';
import AdminTicketManagement from './pages/admin/TicketManagement';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Signed-in application shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/tickets" element={<TicketList />} />
          <Route path="/tickets/new" element={<CreateTicket />} />
          <Route path="/tickets/:id" element={<TicketDetails />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Admin-only */}
      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/tickets" replace />} />
          <Route path="/admin/tickets" element={<AdminTicketManagement />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
