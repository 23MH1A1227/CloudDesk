import { Link } from 'react-router-dom';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../ui/Badge';
import { UserCell } from '../ui/Avatar';
import { relativeTime } from '../../utils/format';

export default function TicketTable({ tickets, showCustomer = true, showAssignee = true, actions }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Subject</th>
            {showCustomer && <th>Customer</th>}
            <th>Status</th>
            <th>Priority</th>
            <th className="hide-mobile">Category</th>
            {showAssignee && <th className="hide-mobile">Assigned to</th>}
            <th className="hide-mobile">Updated</th>
            {actions && <th />}
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td>
                <Link to={`/tickets/${ticket.id}`} className="mono">
                  {ticket.reference}
                </Link>
              </td>
              <td style={{ maxWidth: 320 }}>
                <Link to={`/tickets/${ticket.id}`} className="table__cell-strong" style={{ color: 'var(--text)' }}>
                  {ticket.title}
                </Link>
              </td>
              {showCustomer && (
                <td>
                  <UserCell user={ticket.customer} showEmail={false} />
                </td>
              )}
              <td>
                <StatusBadge status={ticket.status} />
              </td>
              <td>
                <PriorityBadge priority={ticket.priority} />
              </td>
              <td className="hide-mobile">
                <CategoryBadge category={ticket.category} />
              </td>
              {showAssignee && (
                <td className="hide-mobile">
                  <UserCell user={ticket.assignee} showEmail={false} />
                </td>
              )}
              <td className="hide-mobile text-sm text-muted">{relativeTime(ticket.updatedAt)}</td>
              {actions && <td className="table__actions">{actions(ticket)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
