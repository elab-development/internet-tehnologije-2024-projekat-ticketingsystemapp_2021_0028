import React from "react";

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  className = "",
  sizes = [5, 10, 20],
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div
      className={`d-flex flex-wrap align-items-center justify-content-between gap-2 ${className}`}
    >
      <div className="small text-muted">
        Showing <strong>{from}</strong>–<strong>{to}</strong> of{" "}
        <strong>{total}</strong>
      </div>

      <div className="d-flex align-items-center gap-2">
        <select
          className="form-select form-select-sm"
          value={pageSize}
          onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
          style={{ width: 110 }}
        >
          {sizes.map((s) => (
            <option key={s} value={s}>
              {s} / page
            </option>
          ))}
        </select>

        <div className="btn-group">
          <button
            className="btn btn-sm btn-primary"
            aria-disabled={!canPrev}
            style={!canPrev ? { pointerEvents: "none", opacity: 0.5 } : undefined}
            onClick={() => canPrev && onPageChange?.(page - 1)}
            title="Previous page"
          >
            ‹ Prev
          </button>

          <button className="btn btn-sm btn-light text-dark" disabled>
            {page}/{totalPages}
          </button>

          <button
            className="btn btn-sm btn-primary"
            aria-disabled={!canNext}
            style={!canNext ? { pointerEvents: "none", opacity: 0.5 } : undefined}
            onClick={() => canNext && onPageChange?.(page + 1)}
            title="Next page"
          >
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}
