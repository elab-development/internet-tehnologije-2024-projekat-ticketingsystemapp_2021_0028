import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg bg-light px-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
      <Link className="navbar-brand fw-bold" to="/">Ticketing</Link>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
        <span className="navbar-toggler-icon"></span>
      </button>

      <div id="navMenu" className="collapse navbar-collapse">
        <ul className="navbar-nav me-auto">
          {user && (
            <>
              <li className="nav-item"><Link className="nav-link" to="/dashboard">Dashboard</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/projects">Projects</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/tasks">Tasks</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/analytics">Analytics</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/messages">Messages</Link></li>
            </>
          )}
        </ul>
        <div className="d-flex align-items-center gap-3">
          {user ? (
            <>
              <span className="text-muted small">{user.name} · {user.role}</span>
              <button className="btn btn-outline-secondary btn-sm" onClick={onLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link className="btn btn-outline-primary btn-sm" to="/login">Login</Link>
              <Link className="btn btn-primary btn-sm" to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
