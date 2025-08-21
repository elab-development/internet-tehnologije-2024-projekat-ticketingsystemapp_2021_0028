import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './routes/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import TasksPage from './pages/TaskPage';
 

export default function App() {
  return (
    <div className="app-shell">
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage/>} />
            <Route path="/register" element={<RegisterPage/>} />

            <Route element={<ProtectedRoute/>}>
              <Route path="/dashboard" element={<Dashboard/>} />
              <Route path="/projects" element={<ProjectsPage/>} />
              <Route path="/projects/:id" element={<ProjectDetailsPage/>} />
              <Route path="/tasks" element={<TasksPage/>} />
              {/* sledeće: /projects, /tasks, /messages ... */}
            </Route>

            <Route path="*" element={<div className="container py-4"><div className="alert alert-warning">Not found</div></div>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}
