import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ meta, onChange }) {
  if (!meta || meta.total === 0) return null;

  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="pagination">
      <span className="pagination__info">
        Showing {from}–{to} of {meta.total}
      </span>
      <div className="pagination__controls">
        <button
          className="btn btn--secondary btn--sm"
          onClick={() => onChange(meta.page - 1)}
          disabled={!meta.hasPrev}
        >
          <ChevronLeft size={15} /> Previous
        </button>
        <span className="text-sm text-muted">
          Page {meta.page} of {meta.totalPages}
        </span>
        <button
          className="btn btn--secondary btn--sm"
          onClick={() => onChange(meta.page + 1)}
          disabled={!meta.hasNext}
        >
          Next <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
