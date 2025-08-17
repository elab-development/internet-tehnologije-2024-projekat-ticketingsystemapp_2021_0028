import React from 'react';

export default function Button({ children, className = '', ...props }) {
  return (
    <button
      className={`btn btn-primary ${className}`}
      style={{ borderRadius: 12, paddingInline: 18 }}
      {...props}
    >
      {children}
    </button>
  );
}