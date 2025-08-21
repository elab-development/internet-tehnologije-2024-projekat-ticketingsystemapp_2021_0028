// src/pages/TasksPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import TaskModal from "../components/TaskModal";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export default function TasksPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tasks, setTasks] = useState([]);

  const [filter, setFilter] = useState({ q: "", status: "" });
  const [openTaskId, setOpenTaskId] = useState(null);

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      setLoading(true); setErr("");
      try {
        const res = await api.get("/tasks", { params: { per_page: 200 } });
        const items = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        if (!cancel) setTasks(items);
      } catch (e) {
        if (!cancel) setErr(e?.response?.data?.message || "Failed to load tasks.");
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    load();
    return () => { cancel = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = (filter.q || "").toLowerCase();
    const st = filter.status || "";
    return tasks.filter(t => {
      const inQ = t.title?.toLowerCase().includes(q) || (t.description||"").toLowerCase().includes(q) || (t.project?.name||"").toLowerCase().includes(q);
      const inS = st ? t.status === st : true;
      return inQ && inS;
    });
  }, [tasks, filter]);

  // grupisanje po projektu
  const groups = useMemo(() => {
    const map = new Map();
    for (const t of filtered) {
      const key = t.project?.name || "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    }
    return Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
  }, [filtered]);

  const onTaskUpdated = (updated) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Tasks</h3>
      </div>

      <div className="d-flex gap-2 flex-wrap mb-3">
        <input
          className="form-control"
          style={{ maxWidth: 280 }}
          placeholder="Search by title/desc/project…"
          value={filter.q}
          onChange={(e)=>setFilter({...filter, q: e.target.value})}
        />
        <select
          className="form-select"
          style={{ maxWidth: 200 }}
          value={filter.status}
          onChange={(e)=>setFilter({...filter, status: e.target.value})}
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : groups.length === 0 ? (
        <div className="text-muted">No tasks.</div>
      ) : (
        groups.map(([projectName, list]) => (
          <div key={projectName} className="card shadow-sm border-0 mb-3">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="card-title mb-0">📁 {projectName}</h5>
                <span className="badge text-bg-secondary">{list.length}</span>
              </div>
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th style={{width:"40%"}}>Title</th>
                      <th>Assignee</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th style={{width: 90}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(t => (
                      <tr key={t.id}>
                        <td className="break-word">
                          <div className="fw-semibold">{t.title}</div>
                          <div className="small text-muted line-clamp-2">{t.description || "—"}</div>
                        </td>
                        <td className="small">{t.user?.name || "—"}</td>
                        <td>
                          <span className={`badge text-bg-${
                            t.status==="done"?"success":t.status==="in_progress"?"warning":"secondary"
                          }`}>{t.status}</span>
                        </td>
                        <td className="small text-muted">{t.created_at ? new Date(t.created_at).toLocaleString() : "—"}</td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-primary" onClick={()=>setOpenTaskId(t.id)}>Open</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))
      )}

      {openTaskId && (
        <>
          <TaskModal taskId={openTaskId} onClose={()=>setOpenTaskId(null)} onUpdated={onTaskUpdated}/>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </div>
  );
}
