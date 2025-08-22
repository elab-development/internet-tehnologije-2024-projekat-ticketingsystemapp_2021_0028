import React, { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";

export default function MotivationBubble() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [quote, setQuote] = useState(null);
  const firstOpenFetchedRef = useRef(false);

  
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("motivation:last");
      if (cached) setQuote(JSON.parse(cached));
    } catch {}
  }, []);

  const fetchQuote = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/motivation");
      const payload = {
        text: data?.quote || "Keep going!",
        author: data?.author || "Unknown",
      };
      setQuote(payload);
      try { sessionStorage.setItem("motivation:last", JSON.stringify(payload)); } catch {}
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to fetch quote");
    } finally {
      setLoading(false);
    }
  }, []);

  const openModal = () => {
    setOpen(true);
    
    if (!firstOpenFetchedRef.current) {
      firstOpenFetchedRef.current = true;
      
      if (!quote) fetchQuote();
    }
  };

  const closeModal = () => setOpen(false);

  
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        title="Daily motivation"
        className="position-fixed d-flex align-items-center justify-content-center shadow"
        style={{
          left: 16,
          bottom: 16,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#0d6efd",      
          color: "#000",               
          border: "1px solid rgba(0,0,0,0.15)",
          zIndex: 1060,                
        }}
      >
        <span style={{ fontSize: 22 }} aria-hidden>💡</span>
        <span className="visually-hidden">Motivation</span>
      </button>

      {open && (
        <div
          className="modal fade show"
          role="dialog"
          aria-modal="true"
          style={{ display: "block", background: "rgba(0,0,0,0.35)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Motivation</h5>
                <button type="button" className="btn-close" onClick={closeModal} />
              </div>
              <div className="modal-body">
                {loading ? (
                  <div className="d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    <span>Loading quote…</span>
                  </div>
                ) : err ? (
                  <div className="alert alert-danger mb-0">{err}</div>
                ) : quote ? (
                  <>
                    <blockquote className="blockquote mb-2" style={{ whiteSpace: "pre-wrap" }}>
                      “{quote.text}”
                    </blockquote>
                    <figcaption className="blockquote-footer mb-0">
                      {quote.author}
                    </figcaption>
                  </>
                ) : (
                  <div className="text-muted">No quote yet.</div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closeModal}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={fetchQuote}
                  disabled={loading}
                  title="Get another quote"
                >
                  {loading ? "Fetching…" : "Another one"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {open && <div className="modal-backdrop fade show" />}
    </>
  );
}
