// src/pages/ProjectsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import useAuth from "../hooks/useAuth";

export default function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [projects, setProjects] = useState([]);

  // Modal state
  const [selectProject, setSelectProject] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [picked, setPicked] = useState([]);
  const [busyAttach, setBusyAttach] = useState(false);
  const [userQuery, setUserQuery] = useState("");

  const canManageProject = (project) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (user.role === "manager" && project.created_by === user.id) return true;
    return false;
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/projects");
        const items = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        if (!cancelled) setProjects(items);
      } catch (e) {
        if (!cancelled) setErr(e?.response?.data?.message || "Failed to load projects.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const openMembersModal = async (project) => {
    setSelectProject(project);
    setPicked(project.users?.map(u => u.id) || []);
    setUsersLoading(true);
    setAllUsers([]);
    try {
      // koristi /users koji si dodao
      const res = await api.get("/users", { params: { per_page: 1000 } });
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setAllUsers(list);
    } catch (e) {
      setAllUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const closeMembersModal = () => {
    setSelectProject(null);
    setPicked([]);
    setUserQuery("");
  };

  const filteredUsers = useMemo(() => {
    const q = userQuery.toLowerCase();
    return allUsers.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      (u.position || "").toLowerCase().includes(q)
    );
  }, [allUsers, userQuery]);

  const togglePick = (id) => {
    setPicked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const attachMembers = async () => {
    if (!selectProject) return;
    setBusyAttach(true);
    try {
      await api.post(`/projects/${selectProject.id}/members`, { user_ids: picked }); // očekuje backend rutu
      // optimistic update
      const updatedUsersMap = new Map(allUsers.map(u => [u.id, u]));
      const updatedUsers = picked.map(id => updatedUsersMap.get(id)).filter(Boolean);

      setProjects(prev => prev.map(p => {
        if (p.id !== selectProject.id) return p;
        const existingIds = new Set((p.users || []).map(u => u.id));
        const merged = [...(p.users || [])];
        updatedUsers.forEach(u => { if (!existingIds.has(u.id)) merged.push(u); });
        return { ...p, users: merged };
      }));
      closeMembersModal();
    } catch (e) {
      // CHANGE: user-friendly poruka
      const msg = e?.response?.data?.error || e?.response?.data?.message || "Failed to attach members. Ensure the backend route exists.";
      alert(msg);
    } finally {
      setBusyAttach(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Projects</h3>
        {(user?.role === "manager" || user?.role === "admin") && (
          <button
            className="btn btn-primary"
            onClick={() => alert("Add Project page coming next 😉")}
          >
            + New Project
          </button>
        )}
      </div>

      {err && <div className="alert alert-danger">{err}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : projects.length === 0 ? (
        <div className="text-muted">No projects to show.</div>
      ) : (
        <div className="row g-3">
          {projects.map(p => (
            <div key={p.id} className="col-12 col-md-6 col-lg-4">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body d-flex flex-column">
                  {/* CHANGE: break-word + clamp sprečavaju izlazak teksta */}
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div className="break-word" style={{minWidth: 0}}>
                      <div className="fw-semibold text-truncate" title={p.name}>{p.name}</div> {/* CHANGE */}
                      <div className="small text-muted line-clamp-2" title={p.description || ""}> {/* CHANGE */}
                        {p.description || "—"}
                      </div>
                    </div>
                    <span className="badge text-bg-secondary flex-shrink-0 ms-1"> {/* CHANGE */}
                      {p.users?.length || 0} members
                    </span>
                  </div>

                  {/* Members (collapsible) */}
                  <details className="mt-3">
                    <summary className="small text-muted" style={{cursor:"pointer"}}>
                      View members
                    </summary>
                    <ul className="list-unstyled mt-2 mb-0">
                      {(p.users || []).map(u => (
                        <li key={u.id} className="small d-flex align-items-center justify-content-between break-word">
                          <span>{u.name} <span className="text-muted">· {u.role}</span></span>
                        </li>
                      ))}
                      {(!p.users || p.users.length === 0) && (
                        <li className="small text-muted">No members.</li>
                      )}
                    </ul>
                  </details>

                  <div className="mt-auto d-flex justify-content-between align-items-center pt-3">
                    {/* CHANGE: Open → Project details umesto /tasks */}
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => navigate(`/projects/${p.id}`)} // CHANGE
                    >
                      Open
                    </button>

                    {canManageProject(p) && (
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => openMembersModal(p)}
                        title="Add members to this project"
                      >
                        Add members
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Members Modal */}
      {selectProject && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.35)" }}
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add members · {selectProject.name}</h5>
                <button type="button" className="btn-close" onClick={closeMembersModal}></button>
              </div>
              <div className="modal-body">
                {usersLoading ? (
                  <div>Loading users…</div>
                ) : (
                  <>
                    <input
                      className="form-control mb-2"
                      placeholder="Search users…"
                      value={userQuery}
                      onChange={(e)=>setUserQuery(e.target.value)}
                    />
                    <div className="list-group" style={{maxHeight: 360, overflowY: "auto"}}>
                      {filteredUsers.map(u => (
                        <label key={u.id} className="list-group-item d-flex align-items-center">
                          <input
                            className="form-check-input me-2"
                            type="checkbox"
                            checked={picked.includes(u.id)}
                            onChange={()=>togglePick(u.id)}
                          />
                          <div className="break-word">
                            <div className="fw-semibold small">
                              {u.name} <span className="text-muted">· {u.role}</span>
                            </div>
                            <div className="small text-muted">
                              {u.email}{u.position ? ` · ${u.position}` : ""}
                            </div>
                          </div>
                        </label>
                      ))}
                      {filteredUsers.length === 0 && (
                        <div className="text-muted small">No users.</div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closeMembersModal}>Cancel</button>
                <button className="btn btn-primary" disabled={busyAttach || usersLoading} onClick={attachMembers}>
                  {busyAttach ? "Saving…" : "Save members"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
