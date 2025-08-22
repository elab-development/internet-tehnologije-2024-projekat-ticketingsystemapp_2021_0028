
import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import useAuth from "../hooks/useAuth";
import Pagination from "../components/Pagination";

export default function TaskPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tasks, setTasks] = useState([]);

  
  const [groupPage, setGroupPage] = useState(1);
  const [groupsPerPage, setGroupsPerPage] = useState(4);

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

  
  const groups = useMemo(() => {
    const map = new Map();
    for (const t of tasks) {
      const pid = t.project_id || (t.project?.id ?? "no-project");
      if (!map.has(pid)) {
        map.set(pid, {
          projectId: pid,
          projectName: t.project?.name || "— Unassigned project —",
          tasks: []
        });
      }
      map.get(pid).tasks.push(t);
    }
    
    return [...map.values()].sort((a,b)=>a.projectName.localeCompare(b.projectName));
  }, [tasks]);

  
  const totalGroups = groups.length;
  const start = (groupPage - 1) * groupsPerPage;
  const pageGroups = useMemo(
    () => groups.slice(start, start + groupsPerPage),
    [groups, start, groupsPerPage]
  );

  useEffect(() => { setGroupPage(1); }, [groupsPerPage]);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Tasks</h3>
        <div className="small text-muted">
          {user?.role === "admin" ? "All tasks" :
           user?.role === "manager" ? "Tasks for your projects" :
           "Your assigned tasks"}
        </div>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : totalGroups === 0 ? (
        <div className="text-muted">No tasks.</div>
      ) : (
        <>
          <div className="vstack gap-3">
            {pageGroups.map((g) => (
              <div key={g.projectId} className="card shadow-sm border-0">
                <div className="card-body">
                  <h5 className="card-title mb-2">📁 {g.projectName}</h5>
                  {g.tasks.length === 0 ? (
                    <div className="text-muted">No tasks for this project.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle mb-0">
                        <thead>
                          <tr>
                            <th style={{width: "40%"}}>Title</th>
                            <th>Assignee</th>
                            <th>Status</th>
                            <th>Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.tasks.map(t => (
                            <tr key={t.id}>
                              <td>
                                <div className="fw-semibold">{t.title}</div>
                                <div className="small text-muted line-clamp-2">
                                  {t.description || "—"}
                                </div>
                              </td>
                              <td className="small">{t.user?.name || "—"}</td>
                              <td>
                                <span className={`badge text-bg-${
                                  t.status==="done"?"success":t.status==="in_progress"?"warning":"secondary"
                                }`}>{t.status}</span>
                              </td>
                              <td className="small text-muted">
                                {t.created_at ? new Date(t.created_at).toLocaleString() : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Pagination
            className="mt-3"
            page={groupPage}
            pageSize={groupsPerPage}
            total={totalGroups}
            onPageChange={setGroupPage}
            onPageSizeChange={setGroupsPerPage}
            sizes={[2,4,6,8]}
          />
        </>
      )}
    </div>
  );
}
