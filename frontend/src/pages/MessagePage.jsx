
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";

export default function MessagesPage() {
  const [loadingPeers, setLoadingPeers] = useState(true);
  const [peers, setPeers] = useState([]);
  const [peerErr, setPeerErr] = useState("");

  const [activePeer, setActivePeer] = useState(null);

  const [thread, setThread] = useState([]);
  const [threadPage, setThreadPage] = useState(1);
  const [threadPerPage, setThreadPerPage] = useState(20);
  const [threadTotal, setThreadTotal] = useState(0);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadErr, setThreadErr] = useState("");

  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  
  const [showNew, setShowNew] = useState(false);
  const [newLoading, setNewLoading] = useState(false);
  const [newUsers, setNewUsers] = useState([]);
  const [newQuery, setNewQuery] = useState("");
  const [newPick, setNewPick] = useState(null);
  const [newText, setNewText] = useState("");
  const [newErr, setNewErr] = useState("");

  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  
  const loadPeers = async () => {
    setLoadingPeers(true); setPeerErr("");
    try {
      const { data } = await api.get("/messages/peers");
      setPeers(data);
    } catch (e) {
      setPeerErr(e?.response?.data?.message || "Failed to load conversations.");
    } finally {
      setLoadingPeers(false);
    }
  };

  
  const loadThread = async (peerId, page = 1, perPage = threadPerPage, scroll = true) => {
    if (!peerId) return;
    setThreadLoading(true); setThreadErr("");
    try {
      const { data } = await api.get(`/messages/thread/${peerId}`, {
        params: { page, per_page: perPage },
      });
      const items = data?.data ?? [];
      setThread(items);
      setThreadTotal(data?.total ?? items.length);
      setThreadPage(data?.current_page ?? page);
      setThreadPerPage(data?.per_page ?? perPage);
      
      loadPeers();
      if (scroll) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setThreadErr(e?.response?.data?.message || "Failed to load thread.");
    } finally {
      setThreadLoading(false);
    }
  };

  
  const send = async (e) => {
    e?.preventDefault?.();
    if (!activePeer || !msg.trim()) return;
    setSending(true);
    try {
      await api.post("/messages", {
        receiver_id: activePeer.id,
        content: msg.trim(),
      });
      setMsg("");
      await loadThread(
        activePeer.id,
        Math.ceil((threadTotal + 1) / threadPerPage),
        threadPerPage
      );
      await loadPeers();
    } catch (e) {
      alert(e?.response?.data?.error || e?.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  
  useEffect(() => {
    loadPeers();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (!activePeer) return;
    loadThread(activePeer.id, 1, threadPerPage);

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      loadThread(activePeer.id, threadPage, threadPerPage, false);
    }, 5000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    
  }, [activePeer]);

  const totalPages = Math.max(1, Math.ceil(threadTotal / threadPerPage));

  
  const openNewChat = async () => {
    setShowNew(true);
    setNewErr("");
    setNewText("");
    setNewPick(null);
    setNewQuery("");
    setNewLoading(true);
    try {
      
      const { data } = await api.get("/users/messageable", { params: { per_page: 1000 } });
      const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
      setNewUsers(list);
    } catch (e) {
      setNewErr(e?.response?.data?.message || "Failed to load users.");
      setNewUsers([]);
    } finally {
      setNewLoading(false);
    }
  };

  const closeNewChat = () => {
    setShowNew(false);
  };

  const filteredNewUsers = useMemo(() => {
    const q = newQuery.toLowerCase();
    return newUsers.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.position || "").toLowerCase().includes(q)
    );
  }, [newUsers, newQuery]);

  const startChat = async (sendInitial = false) => {
    if (!newPick) { setNewErr("Select a user first."); return; }

    
    setActivePeer({ id: newPick.id, name: newPick.name, email: newPick.email, role: newPick.role, position: newPick.position });
    closeNewChat();

    if (sendInitial && newText.trim()) {
      
      try {
        await api.post("/messages", { receiver_id: newPick.id, content: newText.trim() });
        setMsg("");
        await loadThread(newPick.id, 1, threadPerPage); 
        await loadPeers();
        
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      } catch (e) {
        alert(e?.response?.data?.error || e?.response?.data?.message || "Failed to send message.");
      }
    } else {
      
      await loadThread(newPick.id, 1, threadPerPage);
    }
  };

  const selectPeer = (p) => {
    setActivePeer(p.peer);
    setThread([]);
    setThreadPage(1);
    setThreadTotal(0);
  };

  return (
    <div className="container py-4">
      <div className="row g-3">
        <div className="col-12">
          <h3 className="mb-0">Messages</h3>
          <div className="text-muted small">Direct messages between users</div>
        </div>

        {/* Left: peers */}
        <div className="col-12 col-md-4 col-lg-3 mb-2">
          <div className="card shadow-sm border-0 h-100">
  <div className="card-header bg-white border-0 pb-0">
    <div className="d-flex align-items-center flex-wrap gap-2">
      <div className="me-auto">
        <h6 className="mb-0">Conversations</h6>
        <div className="small text-muted">People you’ve messaged</div>
      </div>
      <div className="btn-group">
        <button className="btn btn-sm btn-primary" onClick={openNewChat}>+ New message</button>
        <button className="btn btn-sm btn-outline-secondary" onClick={loadPeers}>Refresh</button>
      </div>
    </div>
  </div>

  <div className="card-body pt-2">
    {peerErr && <div className="alert alert-danger">{peerErr}</div>}
    {loadingPeers ? (
      <div>Loading…</div>
    ) : peers.length === 0 ? (
      <div className="text-muted small">No conversations yet.</div>
    ) : (
      <ul className="list-group list-group-flush">
        {peers.map((p) => (
          <li
            key={p.peer?.id || Math.random()}
            className={`list-group-item d-flex justify-content-between align-items-center ${activePeer?.id === p.peer?.id ? "active" : ""}`}
            style={{ cursor: "pointer" }}
            onClick={() => selectPeer(p)}
          >
            <div>
              <div className="fw-semibold small">{p.peer?.name || "(deleted user)"}</div>
              <div className="small text-muted">{p.peer?.email}</div>
            </div>
            {p.unread > 0 && <span className="badge text-bg-primary">{p.unread}</span>}
          </li>
        ))}
      </ul>
    )}
  </div>
</div>

        </div>

        {/* Right: thread */}
        <div className="col-12 col-md-8 col-lg-9">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body d-flex flex-column" style={{ minHeight: 420 }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">
                  {activePeer ? `Chat with ${activePeer.name}` : "Select a conversation"}
                </h6>

                {activePeer && (
                  <div className="d-flex align-items-center gap-2">
                    <select
                      className="form-select form-select-sm"
                      value={threadPerPage}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setThreadPerPage(v);
                        loadThread(activePeer.id, 1, v);
                      }}
                      style={{ width: 110 }}
                    >
                      {[10, 20, 50].map(s => <option key={s} value={s}>{s} / page</option>)}
                    </select>
                    <div className="btn-group">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => loadThread(activePeer.id, Math.max(1, threadPage - 1), threadPerPage)}
                        disabled={threadPage <= 1}
                      >
                        ‹ Prev
                      </button>
                      <button className="btn btn-sm btn-outline-secondary" disabled>
                        {threadPage}/{Math.max(1, Math.ceil(threadTotal / threadPerPage))}
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => loadThread(activePeer.id, Math.min(Math.max(1, Math.ceil(threadTotal / threadPerPage)), threadPage + 1), threadPerPage)}
                        disabled={threadPage >= Math.max(1, Math.ceil(threadTotal / threadPerPage))}
                      >
                        Next ›
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-grow-1 border rounded p-2 mb-2" style={{ overflowY: "auto" }}>
                {threadLoading ? (
                  <div>Loading…</div>
                ) : threadErr ? (
                  <div className="alert alert-danger">{threadErr}</div>
                ) : !activePeer ? (
                  <div className="text-muted small">Pick a conversation to start messaging.</div>
                ) : thread.length === 0 ? (
                  <div className="text-muted small">No messages yet. Say hi 👋</div>
                ) : (
                  <ul className="list-unstyled mb-0">
                    {thread.map((m) => (
                      <li key={m.id} className="mb-2">
                        <div className={`d-flex ${m.sender_id === activePeer.id ? "" : "justify-content-end"}`}>
                          <div
                            className={`p-2 rounded-3 ${m.sender_id === activePeer.id ? "bg-light border" : "bg-primary text-white"}`}
                            style={{ maxWidth: "75%" }}
                            title={new Date(m.sent_at).toLocaleString()}
                          >
                            <div className="small">{m.content}</div>
                          </div>
                        </div>
                      </li>
                    ))}
                    <div ref={bottomRef} />
                  </ul>
                )}
              </div>

              <form className="d-flex gap-2" onSubmit={send}>
                <input
                  className="form-control"
                  value={msg}
                  onChange={(e)=>setMsg(e.target.value)}
                  placeholder={activePeer ? "Type a message…" : "Select a conversation first"}
                  disabled={!activePeer || sending}
                />
                <button className="btn btn-primary" type="submit" disabled={!activePeer || sending || !msg.trim()}>
                  {sending ? "Sending…" : "Send"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* NEW CHAT MODAL */}
      {showNew && (
        <div className="modal fade show" style={{ display:"block", background:"rgba(0,0,0,0.35)" }} aria-modal="true" role="dialog">
          <div className="modal-dialog modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Start new message</h5>
                <button type="button" className="btn-close" onClick={closeNewChat}></button>
              </div>
              <div className="modal-body">
                {newErr && <div className="alert alert-danger">{newErr}</div>}

                <label className="form-label fw-semibold">To</label>
                <input
                  className="form-control mb-2"
                  placeholder="Search users…"
                  value={newQuery}
                  onChange={(e)=>setNewQuery(e.target.value)}
                  disabled={newLoading}
                />

                <div className="list-group mb-3" style={{ maxHeight: 260, overflowY: "auto" }}>
                  {newLoading ? (
                    <div className="list-group-item">Loading users…</div>
                  ) : filteredNewUsers.length === 0 ? (
                    <div className="list-group-item text-muted small">No users found.</div>
                  ) : (
                    filteredNewUsers.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${newPick?.id === u.id ? "active" : ""}`}
                        onClick={()=>setNewPick(u)}
                      >
                        <div className="me-2">
                          <div className="fw-semibold small">{u.name}</div>
                          <div className="small text-muted">{u.email}{u.position ? ` · ${u.position}` : ""}</div>
                        </div>
                        {newPick?.id === u.id && <span className="badge text-bg-primary">Selected</span>}
                      </button>
                    ))
                  )}
                </div>

                <label className="form-label fw-semibold">Message (optional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={newText}
                  onChange={(e)=>setNewText(e.target.value)}
                  placeholder="Say hi 👋 (optional)"
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closeNewChat}>Cancel</button>
                <button className="btn btn-secondary" onClick={()=>startChat(false)} disabled={!newPick}>Start chat</button>
                <button className="btn btn-primary" onClick={()=>startChat(true)} disabled={!newPick}>Send & start</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNew && <div className="modal-backdrop fade show" />}
    </div>
  );
}
