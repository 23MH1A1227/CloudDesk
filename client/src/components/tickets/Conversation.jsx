import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { EmptyState } from '../ui/States';
import { formatDateTime, ROLE_LABELS } from '../../utils/format';
import { MessagesSquare } from 'lucide-react';

export default function Conversation({ messages, currentUserId, description, customer, createdAt }) {
  return (
    <div className="conversation">
      {/* The original ticket description is the first message in the thread. */}
      <div className="message">
        <Avatar user={customer} size="sm" />
        <div className="message__bubble">
          <div className="message__meta">
            <span className="message__author">{customer?.name}</span>
            <Badge tone="neutral">Original request</Badge>
            <span>{formatDateTime(createdAt)}</span>
          </div>
          <div className="message__body">{description}</div>
        </div>
      </div>

      {messages.length === 0 && (
        <EmptyState icon={MessagesSquare} title="No replies yet" message="Messages on this ticket will appear here." />
      )}

      {messages.map((message) => {
        const own = message.authorId === currentUserId;
        return (
          <div
            key={message.id}
            className={`message ${own ? 'message--own' : ''} ${message.isInternal ? 'message--internal' : ''}`}
          >
            <Avatar user={message.author} size="sm" />
            <div className="message__bubble">
              <div className="message__meta">
                <span className="message__author">{message.author?.name}</span>
                <Badge tone={message.author?.role === 'CUSTOMER' ? 'neutral' : 'info'}>
                  {ROLE_LABELS[message.author?.role]}
                </Badge>
                {message.isInternal && <Badge tone="warning">Internal note</Badge>}
                <span>{formatDateTime(message.createdAt)}</span>
              </div>
              <div className="message__body">{message.body}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
