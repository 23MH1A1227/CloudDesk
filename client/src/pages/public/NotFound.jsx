import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function NotFound() {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 'var(--space-5)' }}>
      <div className="state">
        <div className="state__icon" style={{ width: 64, height: 64 }}>
          <Compass size={30} />
        </div>
        <h1 style={{ fontSize: '2.6rem' }}>404</h1>
        <div className="state__title">This page does not exist</div>
        <p className="state__text">
          The link may be broken, or the page may have been moved. Let&apos;s get you back to somewhere useful.
        </p>
        <Link className="btn btn--primary" to={isAuthenticated ? '/dashboard' : '/'}>
          <ArrowLeft size={16} /> {isAuthenticated ? 'Back to dashboard' : 'Back to home'}
        </Link>
      </div>
    </div>
  );
}
