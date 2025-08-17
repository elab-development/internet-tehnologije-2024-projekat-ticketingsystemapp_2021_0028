import React from 'react';

export default function Input({ label, type='text', error, ...props }) {
  return (
    <div className="mb-3">
      {label && <label className="form-label fw-semibold">{label}</label>}
      <input type={type} className={`form-control ${error ? 'is-invalid' : ''}`} {...props} />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}