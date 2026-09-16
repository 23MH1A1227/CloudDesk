import { initials } from '../../utils/format';

export default function Avatar({ user, size = 'md' }) {
  if (!user) return <div className={`avatar avatar--${size}`} aria-hidden="true">?</div>;

  if (user.avatarUrl) {
    return (
      <img
        className={`avatar avatar--${size}`}
        src={user.avatarUrl}
        alt=""
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div className={`avatar avatar--${size}`} title={user.name} aria-hidden="true">
      {initials(user.name) || '?'}
    </div>
  );
}

export function UserCell({ user, size = 'sm', showEmail = true }) {
  if (!user) return <span className="text-subtle">Unassigned</span>;
  return (
    <div className="user-cell">
      <Avatar user={user} size={size} />
      <div style={{ minWidth: 0 }}>
        <div className="user-cell__name">{user.name}</div>
        {showEmail && <div className="user-cell__email">{user.email}</div>}
      </div>
    </div>
  );
}
