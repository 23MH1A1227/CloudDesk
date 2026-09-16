import { Sparkles, AlertCircle, Copy, RefreshCw, HelpCircle, Target } from 'lucide-react';
import Badge, { PriorityBadge, SentimentBadge } from '../ui/Badge';
import { EmptyState } from '../ui/States';
import { formatDateTime } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

export default function AIAnalysisPanel({ analysis, loading, onAnalyze, onUseResponse, canAnalyze = true }) {
  const toast = useToast();

  const copyResponse = async () => {
    try {
      await navigator.clipboard.writeText(analysis.suggestedResponse);
      toast.success('Copied', 'Suggested response copied to your clipboard.');
    } catch {
      toast.error('Copy failed', 'Your browser blocked clipboard access.');
    }
  };

  return (
    <section className="card">
      <div className="card__header">
        <div className="row gap-2">
          <Sparkles size={17} style={{ color: 'var(--primary)' }} />
          <span className="card__title">AI analysis</span>
        </div>
        {canAnalyze && (
          <button className="btn btn--secondary btn--sm" onClick={onAnalyze} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 13, height: 13 }} /> : <RefreshCw size={14} />}
            {analysis ? 'Re-analyze' : 'Analyze with AI'}
          </button>
        )}
      </div>

      <div className="card__body">
        {!analysis && !loading && (
          <EmptyState
            icon={Sparkles}
            title="No analysis yet"
            message="Run an AI analysis to get a summary, sentiment read, a suggested reply and a recommended next action."
            action={
              canAnalyze ? (
                <button className="btn btn--primary btn--sm" onClick={onAnalyze}>
                  <Sparkles size={15} /> Analyze with AI
                </button>
              ) : null
            }
          />
        )}

        {loading && !analysis && (
          <div className="state">
            <div className="spinner spinner--lg" />
            <p className="state__text">Analysing the ticket…</p>
          </div>
        )}

        {analysis && (
          <>
            {!analysis.available && (
              <div className="alert alert--warning mb-4">
                <AlertCircle size={17} style={{ flexShrink: 0 }} />
                <div>
                  <strong>AI analysis unavailable.</strong> This result came from CloudDesk&apos;s deterministic
                  rule-based analyser, not Gemini. Configure <code>GEMINI_API_KEY</code> on the server for model-backed
                  analysis.
                </div>
              </div>
            )}

            <div className="ai-panel__section" style={{ paddingTop: 0 }}>
              <div className="ai-panel__label">Summary</div>
              <p className="ai-panel__text">{analysis.summary}</p>
            </div>

            <div className="ai-panel__section">
              <div className="ai-panel__label">Classification</div>
              <div className="ai-panel__chips">
                <Badge tone="primary">{analysis.category}</Badge>
                <PriorityBadge priority={analysis.priority} />
                <SentimentBadge sentiment={analysis.sentiment} />
              </div>
            </div>

            <div className="ai-panel__section">
              <div className="ai-panel__label">
                <HelpCircle size={12} /> Missing information
              </div>
              {analysis.missingInformation?.length ? (
                <ul className="ai-panel__list">
                  {analysis.missingInformation.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="ai-panel__text text-muted">Nothing obvious is missing from this ticket.</p>
              )}
            </div>

            <div className="ai-panel__section">
              <div className="row between mb-3">
                <span className="ai-panel__label" style={{ marginBottom: 0 }}>
                  Suggested response
                </span>
                <div className="row gap-2">
                  <button className="btn btn--ghost btn--sm" onClick={copyResponse}>
                    <Copy size={13} /> Copy
                  </button>
                  {onUseResponse && (
                    <button className="btn btn--secondary btn--sm" onClick={() => onUseResponse(analysis.suggestedResponse)}>
                      Use as draft
                    </button>
                  )}
                </div>
              </div>
              <div className="ai-suggestion">{analysis.suggestedResponse}</div>
            </div>

            <div className="ai-panel__section">
              <div className="ai-panel__label">
                <Target size={12} /> Recommended action
              </div>
              <p className="ai-panel__text">{analysis.recommendedAction}</p>
            </div>

            <div className="text-xs text-subtle mt-4">
              {analysis.source === 'GEMINI' ? `Gemini (${analysis.model})` : 'Rule-based fallback'} ·{' '}
              {formatDateTime(analysis.createdAt)}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
