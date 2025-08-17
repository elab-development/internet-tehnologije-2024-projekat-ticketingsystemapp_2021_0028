import React, { useMemo } from "react";

export default function TaskList({ tasks = [], onFilterChange, filter }) {
  const filtered = useMemo(() => {
    const q = (filter?.q || "").toLowerCase();
    const status = filter?.status || "";
    return tasks.filter(t => {
      const matchesQ = t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q);
      const matchesStatus = status ? t.status === status : true;
      return matchesQ && matchesStatus;
    });
  }, [tasks, filter]);

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex gap-2 flex-wrap mb-3">
          <input
            className="form-control"
            style={{maxWidth: 280}}
            placeholder="Search tasks..."
            value={filter.q}
            onChange={(e) => onFilterChange({ ...filter, q: e.target.value })}
          />
          <select
            className="form-select"
            style={{maxWidth: 200}}
            value={filter.status}
            onChange={(e) => onFilterChange({ ...filter, status: e.target.value })}
          >
            <option value="">All statuses</option>
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-muted">No tasks match your filter.</div>
        ) : (
          <ul className="list-group list-group-flush">
            {filtered.slice(0, 8).map(task => (
              <li key={task.id} className="list-group-item d-flex justify-content-between align-items-start">
                <div>
                  <div className="fw-semibold">{task.title}</div>
                  <div className="small text-muted">{task.project?.name || "—"}</div>
                </div>
                <span className={`badge text-bg-${
                  task.status === "done" ? "success" :
                  task.status === "in_progress" ? "warning" : "secondary"
                }`}>{task.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
