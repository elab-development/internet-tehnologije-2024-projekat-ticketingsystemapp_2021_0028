import React from "react";

export default function StatCard({ title, value, icon, className = "" }) {
  return (
    <div className={`card shadow-sm border-0 ${className}`}>
      <div className="card-body d-flex align-items-center gap-3">
        {icon && <div className="display-6">{icon}</div>}
        <div>
          <div className="text-muted small">{title}</div>
          <div className="fs-4 fw-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}
