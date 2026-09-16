import { Link } from 'react-router-dom';
import { MessageSquare, Paperclip, Clock, User } from 'lucide-react';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../ui/Badge';
import { relativeTime } from '../../utils/format';

export default function TicketCard({ ticket, showCustomer = false }) {
  return (
    <Link to={`/tickets/${ticket.id}`} className="ticket-card">
      <div className="ticket-card__top">
        <span className="ticket-card__ref">{ticket.reference}</span>
        <StatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
        <CategoryBadge category={ticket.category} />
      </div>
      <div className="ticket-card__title">{ticket.title}</div>
      <p className="ticket-card__desc">{ticket.description}</p>
      <div className="ticket-card__meta">
        <span>
          <Clock size={13} /> {relativeTime(ticket.createdAt)}
        </span>
        <span>
          <MessageSquare size={13} /> {ticket._count?.messages ?? 0}
        </span>
        <span>
          <Paperclip size={13} /> {ticket._count?.attachments ?? 0}
        </span>
        {showCustomer && ticket.customer && (
          <span>
            <User size={13} /> {ticket.customer.name}
          </span>
        )}
      </div>
    </Link>
  );
}
