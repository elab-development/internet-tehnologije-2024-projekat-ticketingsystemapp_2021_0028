// src/components/TaskModal.jsx
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

  // comments
  const [comments, setComments] = useState([]);
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentText, setCommentText] = useState("");

  // attachments
  const [files, setFiles] = useState([]);
  const [uploadBusy, setUploadBusy] = useState(false);

  const canChangeStatus = useMemo(() => {
    if (!task || !user) return false;
    if (user.role === "admin") return true;
    if (user.role === "manager" && task.project?.created_by === user.id) return true;
    if (user.role === "employee" && task.assigned_to === user.id) return true;
    return false;
  }, [task, user]);

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
      // brzo dodaj na vrh (a index backend svakako vraća DESC)
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

  if (!taskId) return null;

  return (
    <div className="modal fade show" style={{ display:"block", background:"rgba(0,0,0,0.35)" }} aria-modal="true" role="dialog">
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
                          onChange={(e)=>setCommentText(e.target.value)}
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
                        {comments.map(c => (
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

                {/* right: status + files */}
                <div className="col-12 col-lg-5">
                  <div className="card border-0 shadow-sm mb-3">
                    <div className="card-body">
                      <div className="fw-semibold mb-2">📌 Status</div>
                      <div className="d-flex gap-2 flex-wrap">
                        {STATUS.map(s => (
                          <button
                            key={s.value}
                            type="button"
                            className={`btn btn-sm ${task?.status===s.value ? "btn-primary" : "btn-outline-primary"}`}
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
                          {files.map(f => (
                            <li key={f.id} className="list-group-item d-flex justify-content-between align-items-center">
                              <div className="small break-word">{f.original_name}</div>
                              <a className="btn btn-sm btn-outline-primary" href={`${process.env.REACT_APP_API_BASE}/api/attachments/${f.id}/download`} target="_blank" rel="noreferrer">
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
