
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import useAuth from "../hooks/useAuth";
import Pagination from "../components/Pagination"; 
import Breadcrumbs from "../components/Breadcrumbs";

export default function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [projects, setProjects] = useState([]);

  
  const [selectProject, setSelectProject] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [picked, setPicked] = useState([]);
  const [busyAttach, setBusyAttach] = useState(false);
  const [userQuery, setUserQuery] = useState("");

  
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState("");
  const [form, setForm] = useState({ name: "", description: "" });
  const [createPicked, setCreatePicked] = useState([]);
  const [createUsersLoading, setCreateUsersLoading] = useState(false);
  const [createUserQuery, setCreateUserQuery] = useState("");

  
  const [sortKey, setSortKey] = useState("name");     
  const [sortDir, setSortDir] = useState("asc");      

  
  const [page, setPage] = useState(1);                
  const [pageSize, setPageSize] = useState(6);        

  const canManageProject = (project) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (user.role === "manager" && project.created_by === user.id) return true;
    return false;
  };

  const canCreateProject = user?.role === "admin" || user?.role === "manager";

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

  
  const sortedProjects = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const safe = (v) => (v ?? "");
    const toTime = (v) => (v ? new Date(v).getTime() : 0);
    return [...projects].sort((a, b) => {
      if (sortKey === "name") return safe(a.name).localeCompare(safe(b.name)) * dir;
      if (sortKey === "created_at") return (toTime(a.created_at) - toTime(b.created_at)) * dir;
      if (sortKey === "members") {
        const ma = a?.users?.length || 0;
        const mb = b?.users?.length || 0;
        return (ma - mb) * dir;
      }
      return 0;
    });
  }, [projects, sortKey, sortDir]);

  
  const totalProjects = sortedProjects.length; 
  const startIndex = (page - 1) * pageSize;    
  const pageItems = useMemo(                 
    () => sortedProjects.slice(startIndex, startIndex + pageSize),
    [sortedProjects, startIndex, pageSize]
  );

  
  useEffect(() => { setPage(1); }, [sortKey, sortDir, pageSize]); 

  const openMembersModal = async (project) => {
    setSelectProject(project);
    setPicked(project.users?.map(u => u.id) || []);
    setUsersLoading(true);
    setAllUsers([]);
    try {
      const res = await api.get("/users", { params: { per_page: 1000 } });
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setAllUsers(list);
    } catch {
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
      await api.post(`/projects/${selectProject.id}/members`, { user_ids: picked });
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
      const msg = e?.response?.data?.error || e?.response?.data?.message || "Failed to attach members. Ensure the backend route exists.";
      alert(msg);
    } finally {
      setBusyAttach(false);
    }
  };

  const openCreateModal = async () => {
    setShowCreate(true);
    setCreateErr("");
    setForm({ name: "", description: "" });
    setCreatePicked([]);
    setCreateUsersLoading(true);
    try {
      const res = await api.get("/users", { params: { per_page: 1000 } });
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setAllUsers(list);
    } catch { /* ignore */ } finally {
      setCreateUsersLoading(false);
    }
  };

  const closeCreateModal = () => {
    setShowCreate(false);
    setCreateErr("");
    setForm({ name: "", description: "" });
    setCreatePicked([]);
    setCreateUserQuery("");
  };

  const filteredUsersForCreate = useMemo(() => {
    const q = createUserQuery.toLowerCase();
    return allUsers.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      (u.position || "").toLowerCase().includes(q)
    );
  }, [allUsers, createUserQuery]);

  const toggleCreatePick = (id) => {
    setCreatePicked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const submitCreate = async (e) => {
    e?.preventDefault?.();
    if (!form.name.trim()) {
      setCreateErr("Name is required.");
      return;
    }
    setCreating(true);
    setCreateErr("");
    try {
      const { data: created } = await api.post("/projects", {
        name: form.name.trim(),
        description: form.description || ""
      });

      if (createPicked.length > 0) {
        try {
          await api.post(`/projects/${created.id}/members`, { user_ids: createPicked });
          const { data: refreshed } = await api.get(`/projects/${created.id}`);
          setProjects(prev => [refreshed, ...prev]);
        } catch {
          setProjects(prev => [created, ...prev]);
        }
      } else {
        setProjects(prev => [created, ...prev]);
      }

      closeCreateModal();
    } catch (e) {
      setCreateErr(e?.response?.data?.message || "Failed to create project.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container py-4">
      <Breadcrumbs trail={[{ label: "Projects" }]} />
      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Projects</h3>

        {/* sort controls + create */}
        <div className="d-flex gap-2">
          <select
            className="form-select form-select-sm"
            value={sortKey}
            onChange={(e)=>setSortKey(e.target.value)}
            title="Sort by"
          >
            <option value="name">Sort: Name</option>
            <option value="created_at">Sort: Created</option>
            <option value="members">Sort: Members</option>
          </select>
          <select
            className="form-select form-select-sm"
            value={sortDir}
            onChange={(e)=>setSortDir(e.target.value)}
            title="Direction"
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>

          {(user?.role === "manager" || user?.role === "admin") && (
            <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
              + New Project
            </button>
          )}
        </div>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : pageItems.length === 0 ? (
        <div className="text-muted">No projects to show.</div>
      ) : (
        <>
          <div className="row g-3">
            {pageItems.map(p => (
              <div key={p.id} className="col-12 col-md-6 col-lg-4">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div className="break-word" style={{minWidth: 0}}>
                        <div className="fw-semibold text-truncate" title={p.name}>{p.name}</div>
                        <div className="small text-muted line-clamp-2" title={p.description || ""}>
                          {p.description || "—"}
                        </div>
                      </div>
                      <span className="badge text-bg-secondary flex-shrink-0 ms-1">
                        {p.users?.length || 0} members
                      </span>
                    </div>

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
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => navigate(`/projects/${p.id}`)}
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

          {/* CHANGE: pagination controls */}
          <Pagination
            className="mt-3"
            page={page}
            pageSize={pageSize}
            total={totalProjects}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
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

      {/* CREATE PROJECT MODAL */}
      {showCreate && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.35)" }}
          aria-modal="true"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-scrollable">
            <form className="modal-content" onSubmit={submitCreate}>
              <div className="modal-header">
                <h5 className="modal-title">New Project</h5>
                <button type="button" className="btn-close" onClick={closeCreateModal}></button>
              </div>
              <div className="modal-body">
                {createErr && <div className="alert alert-danger">{createErr}</div>}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Name</label>
                  <input
                    className="form-control"
                    value={form.name}
                    onChange={(e)=>setForm({...form, name: e.target.value})}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={form.description}
                    onChange={(e)=>setForm({...form, description: e.target.value})}
                    placeholder="(optional)"
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label fw-semibold">Add members (optional)</label>
                  {createUsersLoading ? (
                    <div>Loading users…</div>
                  ) : (
                    <>
                      <input
                        className="form-control mb-2"
                        placeholder="Search users…"
                        value={createUserQuery}
                        onChange={(e)=>setCreateUserQuery(e.target.value)}
                      />
                      <div className="list-group" style={{ maxHeight: 260, overflowY: "auto" }}>
                        {filteredUsersForCreate.map(u => (
                          <label key={u.id} className="list-group-item d-flex align-items-center">
                            <input
                              className="form-check-input me-2"
                              type="checkbox"
                              checked={createPicked.includes(u.id)}
                              onChange={()=>toggleCreatePick(u.id)}
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
                        {filteredUsersForCreate.length === 0 && (
                          <div className="text-muted small">No users.</div>
                        )}
                      </div>
                      <div className="form-text">
                        The creator is added automatically; here you can add more members.
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={closeCreateModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? "Creating…" : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {(selectProject || showCreate) && <div className="modal-backdrop fade show" />}
    </div>
  );
}
