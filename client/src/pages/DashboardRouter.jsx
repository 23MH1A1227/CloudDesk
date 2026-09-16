import { useAuth } from '../context/AuthContext';
import CustomerDashboard from './customer/CustomerDashboard';
import AgentDashboard from './agent/AgentDashboard';
import AdminDashboard from './admin/AdminDashboard';

/** Renders the dashboard that matches the signed-in user's role. */
export default function DashboardRouter() {
  const { user } = useAuth();

  if (user?.role === 'ADMIN') return <AdminDashboard />;
  if (user?.role === 'SUPPORT_AGENT') return <AgentDashboard />;
  return <CustomerDashboard />;
}
