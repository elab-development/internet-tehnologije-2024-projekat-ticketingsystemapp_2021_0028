
import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import useAuth from "../hooks/useAuth";

const STATUS = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export default function TaskModal({ taskId, onClose, onUpdated }) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [task, setTask] = useState(null);

  const [statusBusy, setStatusBusy] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentText, setCommentText] = useState("");

  const [files, setFiles] = useState([]);
  const [uploadBusy, setUploadBusy] = useState(false);

  const [timeEntries, setTimeEntries] = useState([]);
  const [timeLoading, setTimeLoading] = useState(true);
  const [timeErr, setTimeErr] = useState("");
  const [creatingTime, setCreatingTime] = useState(false);
  const [newTime, setNewTime] = useState({
    hours: "",
    work_date: new Date().toISOString().slice(0, 10),
  });

  const canChangeStatus = useMemo(() => {
    if (!task || !user) return false;
    if (user.role === "admin") return true;
    if (user.role === "manager" && task.project?.created_by === user.id) return true;
    if (user.role === "employee" && task.assigned_to === user.id) return true;
    return false;
  }, [task, user]);

  const canLogTime = useMemo(() => {
    if (!task || !user) return false;
    if (user.role === "admin") return true;
    if (user.role === "manager" && task.project?.created_by === user.id) return true;
    return task.assigned_to === user.id;
  }, [task, user]);

  const totalHours = useMemo(
    () => timeEntries.reduce((s, t) => s + (Number(t.hours) || 0), 0),
    [timeEntries]
  );

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      setLoading(true); setErr("");
      try {
        const [tRes, cRes, aRes] = await Promise.all([
          api.get(`/tasks/${taskId}`),
          api.get(`/comments`, { params: { task_id: taskId } }),
          api.get(`/tasks/${taskId}/attachments`),
        ]);
        if (!cancel) {
          setTask(tRes.data);
          setComments(Array.isArray(cRes.data) ? cRes.data : []);
          setFiles(Array.isArray(aRes.data) ? aRes.data : []);
        }
      } catch (e) {
        if (!cancel) setErr(e?.response?.data?.message || "Failed to load task.");
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    load();
    return () => { cancel = true; };
  }, [taskId]);

  useEffect(() => {
    let cancel = false;
    const run = async () => {
      setTimeLoading(true); setTimeErr("");
      try {
        try {
          const { data } = await api.get("/time-entries", { params: { task_id: taskId, per_page: 200 } });
          if (!cancel) setTimeEntries(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
        } catch {
          const { data } = await api.get(`/tasks/${taskId}/time-entries`);
          if (!cancel) setTimeEntries(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
        }
      } catch (e) {
        if (!cancel) setTimeErr(e?.response?.data?.message || "Failed to load time entries.");
      } finally {
        if (!cancel) setTimeLoading(false);
      }
    };
    if (taskId) run();
    return () => { cancel = true; };
  }, [taskId]);

  const updateStatus = async (newStatus) => {
    if (!canChangeStatus) return;
    setStatusBusy(true);
    try {
      const { data } = await api.put(`/tasks/${task.id}`, { status: newStatus });
      setTask(prev => ({ ...prev, status: data.status }));
      onUpdated?.(data);
    } catch (e) {
      alert(e?.response?.data?.error || e?.response?.data?.message || "Failed to update status");
    } finally {
      setStatusBusy(false);
    }
  };

  const postComment = async (e) => {
    e?.preventDefault?.();
    if (!commentText.trim()) return;
    setCommentBusy(true);
    try {
      const { data } = await api.post("/comments", { task_id: task.id, content: commentText.trim() });
      setComments(prev => [{ ...data, user: { name: user.name, role: user.role } }, ...prev]);
      setCommentText("");
    } catch (e) {
      alert(e?.response?.data?.error || e?.response?.data?.message || "Failed to add comment");
    } finally {
      setCommentBusy(false);
    }
  };

  const onFilePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post(`/tasks/${task.id}/attachments`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFiles(prev => [data, ...prev]);
    } catch (e) {
      alert(e?.response?.data?.error || e?.response?.data?.message || "Failed to upload");
    } finally {
      setUploadBusy(false);
      e.target.value = "";
    }
  };

  const createTimeEntry = async (e) => {
    e?.preventDefault?.();
    if (!canLogTime) return;

    const hoursNum = Number(newTime.hours);
    if (!hoursNum || hoursNum <= 0) {
      alert("Enter a positive number of hours.");
      return;
    }
    if (!newTime.work_date) {
      alert("Pick a work date.");
      return;
    }

    setCreatingTime(true);
    try {
      const payload = {
        task_id: task.id,
        hours: hoursNum,
        work_date: newTime.work_date,
      };
      const { data } = await api.post("/time-entries", payload);
      setTimeEntries(prev => [{ ...data, user: { id: user.id, name: user.name } }, ...prev]);
      setNewTime({ hours: "", work_date: new Date().toISOString().slice(0, 10) });
    } catch (e) {
      alert(e?.response?.data?.error || e?.response?.data?.message || "Failed to add time entry");
    } finally {
      setCreatingTime(false);
    }
  };

  if (!taskId) return null;

  return (
    <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,0.35)" }} aria-modal="true" role="dialog">
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <div className="fw-semibold">{loading ? "Loading…" : task?.title}</div>
              {!loading && <div className="small text-muted">{task?.project?.name || "—"} · Assigned: {task?.user?.name || "—"}</div>}
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            {err && <div className="alert alert-danger">{err}</div>}
            {loading ? (
              <div>Loading…</div>
            ) : (
              <div className="row g-4">
                {/* left: description + comments */}
                <div className="col-12 col-lg-7">
                  <div className="mb-3">
                    <div className="text-muted small fw-semibold mb-1">Description</div>
                    <div className="break-word">{task?.description || "—"}</div>
                  </div>

                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="fw-semibold">💬 Comments</div>
                    </div>
                    <form onSubmit={postComment} className="mb-2">
                      <div className="input-group">
                        <input
                          className="form-control"
                          placeholder="Write a comment…"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                        />
                        <button className="btn btn-primary" disabled={commentBusy || !commentText.trim()}>
                          {commentBusy ? "Posting…" : "Post"}
                        </button>
                      </div>
                    </form>
                    {comments.length === 0 ? (
                      <div className="text-muted small">No comments yet.</div>
                    ) : (
                      <ul className="list-group list-group-flush">
                        {comments.map((c) => (
                          <li key={c.id} className="list-group-item">
                            <div className="small">
                              <span className="fw-semibold">{c.user?.name || "User"}</span>{" "}
                              <span className="text-muted">· {new Date(c.created_at).toLocaleString()}</span>
                            </div>
                            <div className="break-word">{c.content}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* right: status + files + time entries */}
                <div className="col-12 col-lg-5">
                  <div className="card border-0 shadow-sm mb-3">
                    <div className="card-body">
                      <div className="fw-semibold mb-2">📌 Status</div>
                      <div className="d-flex gap-2 flex-wrap">
                        {STATUS.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            className={`btn btn-sm ${task?.status === s.value ? "btn-primary" : "btn-outline-primary"}`}
                            disabled={!canChangeStatus || statusBusy}
                            onClick={() => updateStatus(s.value)}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                      {!canChangeStatus && <div className="small text-muted mt-2">You cannot change this task’s status.</div>}
                    </div>
                  </div>

                  {/* TIME ENTRIES (NEW) */}
                  <div className="card border-0 shadow-sm mb-3">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="fw-semibold">⏱️ Time entries</div>
                        <div className="badge text-bg-secondary">Total: {totalHours.toFixed(2)} h</div>
                      </div>

                      {/* add form */}
                      <form className="row g-2 align-items-end mb-2" onSubmit={createTimeEntry}>
                        <div className="col-5">
                          <label className="form-label small mb-1">Hours</label>
                          <input
                            type="number"
                            min="0.25"
                            step="0.25"
                            className="form-control form-control-sm"
                            value={newTime.hours}
                            onChange={(e) => setNewTime({ ...newTime, hours: e.target.value })}
                            disabled={!canLogTime || creatingTime}
                            placeholder="e.g. 1.5"
                          />
                        </div>
                        <div className="col-7">
                          <label className="form-label small mb-1">Work date</label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={newTime.work_date}
                            onChange={(e) => setNewTime({ ...newTime, work_date: e.target.value })}
                            disabled={!canLogTime || creatingTime}
                          />
                        </div>
                        <div className="col-12">
                          <button className="btn btn-primary btn-sm" disabled={!canLogTime || creatingTime || !newTime.hours || !newTime.work_date}>
                            {creatingTime ? "Adding…" : "Add time"}
                          </button>
                          {!canLogTime && <span className="small text-muted ms-2">Only the assignee (or manager/admin) can log time.</span>}
                        </div>
                      </form>

                      {/* list */}
                      {timeLoading ? (
                        <div>Loading…</div>
                      ) : timeErr ? (
                        <div className="alert alert-danger mb-0">{timeErr}</div>
                      ) : timeEntries.length === 0 ? (
                        <div className="text-muted small">No time entries yet.</div>
                      ) : (
                        <ul className="list-group list-group-flush">
                          {timeEntries
                            .slice()
                            .sort((a, b) => new Date(b.work_date) - new Date(a.work_date))
                            .map((te) => (
                              <li key={te.id} className="list-group-item d-flex justify-content-between align-items-center">
                                <div className="small">
                                  <span className="fw-semibold">{Number(te.hours).toFixed(2)} h</span>{" "}
                                  <span className="text-muted">· {new Date(te.work_date).toLocaleDateString()}</span>
                                  {te.user?.name && <span className="text-muted"> · {te.user.name}</span>}
                                </div>
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="fw-semibold">📎 Attachments</div>
                        <label className="btn btn-outline-secondary btn-sm mb-0">
                          {uploadBusy ? "Uploading…" : "Upload"}
                          <input type="file" hidden onChange={onFilePick} />
                        </label>
                      </div>
                      {files.length === 0 ? (
                        <div className="small text-muted mt-2">No files.</div>
                      ) : (
                        <ul className="list-group list-group-flush mt-2">
                          {files.map((f) => (
                            <li key={f.id} className="list-group-item d-flex justify-content-between align-items-center">
                              <div className="small break-word">{f.original_name}</div>
                              <a
                                className="btn btn-sm btn-outline-primary"
                                href={`${process.env.REACT_APP_API_BASE}/api/attachments/${f.id}/download`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Download
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
