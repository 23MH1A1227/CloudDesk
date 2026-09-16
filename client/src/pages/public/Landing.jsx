import { Link } from 'react-router-dom';
import {
  CloudCog,
  Sparkles,
  ShieldCheck,
  BarChart3,
  MessagesSquare,
  Bell,
  Moon,
  Sun,
  ArrowRight,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI triage on every ticket',
    text: 'Gemini summarises the problem, reads customer sentiment, flags missing details and drafts a reply your agent can send.',
  },
  {
    icon: MessagesSquare,
    title: 'Threaded conversations',
    text: 'Customers and agents work in one thread, with attachments, internal notes and a full timestamped history.',
  },
  {
    icon: BarChart3,
    title: 'Dashboards that use real data',
    text: 'Volume, status mix, category breakdown and first-response time computed from your actual ticket records.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based access',
    text: 'Customers, support agents and administrators each get their own workspace, enforced on the server.',
  },
  {
    icon: Bell,
    title: 'Notifications built in',
    text: 'Ticket created, agent replied, status changed, assignment and AI analysis events all reach the right person.',
  },
  {
    icon: CloudCog,
    title: 'Cloud ready, cloud optional',
    text: 'Runs entirely on your laptop with Docker Postgres, and moves to RDS, S3 and ECS when you are ready.',
  },
];

const STEPS = [
  { title: 'Customer raises a ticket', text: 'They describe the problem and attach a screenshot or receipt.' },
  { title: 'CloudDesk triages it', text: 'Category, priority, sentiment and a suggested response are generated on the backend.' },
  { title: 'An agent takes it', text: 'The agent reviews the AI panel, replies from the draft and updates the status.' },
  { title: 'Everyone stays informed', text: 'Notifications fire on every state change and admins watch it in analytics.' },
];

export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing">
      <nav className="landing__nav">
        <div className="landing__brand">
          <span className="sidebar__logo">
            <CloudCog size={18} />
          </span>
          CloudDesk
        </div>
        <div className="topbar__spacer" />
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle colour theme">
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        {isAuthenticated ? (
          <Link className="btn btn--primary btn--sm" to="/dashboard">
            Open dashboard
          </Link>
        ) : (
          <>
            <Link className="btn btn--ghost btn--sm" to="/login">
              Sign in
            </Link>
            <Link className="btn btn--primary btn--sm" to="/register">
              Get started
            </Link>
          </>
        )}
      </nav>

      <header className="landing__hero">
        <span className="eyebrow">
          <Sparkles size={14} /> AI-assisted support triage
        </span>
        <h1>Smart customer support, built for the cloud</h1>
        <p>
          CloudDesk turns messy support requests into structured, prioritised work. Customers get answers faster, agents
          get a drafted reply and context up front, and administrators get a live view of the whole queue.
        </p>
        <div className="landing__cta">
          <Link className="btn btn--primary btn--lg" to={isAuthenticated ? '/dashboard' : '/register'}>
            {isAuthenticated ? 'Go to dashboard' : 'Create a free account'} <ArrowRight size={17} />
          </Link>
          <Link className="btn btn--secondary btn--lg" to="/login">
            Sign in
          </Link>
        </div>
      </header>

      <section className="landing__section">
        <div className="landing__section-head">
          <h2>Everything a support desk actually needs</h2>
          <p>No mock data, no placeholder screens — every feature below is backed by the CloudDesk API.</p>
        </div>
        <div className="grid grid--3">
          {FEATURES.map((f) => (
            <article key={f.title} className="card feature">
              <div className="feature__icon">
                <f.icon size={20} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing__section">
        <div className="grid grid--2" style={{ alignItems: 'center' }}>
          <div>
            <h2 className="mb-3">From &ldquo;payment failed&rdquo; to resolved</h2>
            <p className="text-muted mb-4">
              A customer&apos;s payment is deducted but the order fails. Here is what happens next inside CloudDesk.
            </p>
            <div className="steps">
              {STEPS.map((step, i) => (
                <div className="step" key={step.title}>
                  <span className="step__num">{i + 1}</span>
                  <div>
                    <div className="step__title">{step.title}</div>
                    <div className="step__text">{step.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card__header">
              <span className="card__title">AI analysis preview</span>
              <span className="badge badge--primary">Sample</span>
            </div>
            <div className="card__body">
              <div className="ai-panel__label">Summary</div>
              <p className="ai-panel__text mb-4">
                The customer was charged for a laptop order but the order page reports a failed payment. They have a bank
                debit confirmation and want either the order honoured or a refund.
              </p>
              <div className="ai-panel__label">Classification</div>
              <div className="ai-panel__chips mb-4">
                <span className="badge badge--primary">Billing &amp; Payments</span>
                <span className="badge badge--danger">Urgent</span>
                <span className="badge badge--danger">Frustrated</span>
              </div>
              <div className="ai-panel__label">Recommended action</div>
              <p className="ai-panel__text">
                Escalate to a senior agent immediately and acknowledge the customer within 15 minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing__footer">
        CloudDesk · React + Express + Prisma + PostgreSQL + Google Gemini · Built as a portfolio project
      </footer>
    </div>
  );
}
