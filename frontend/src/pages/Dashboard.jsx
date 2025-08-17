import React from 'react';
import Card from '../components/Card';
import useAuth from '../hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h2 className="text-white fw-bold">Dashboard</h2>
        <p className="text-white-50">Welcome, {user?.name}. Your role is <b>{user?.role}</b>.</p>
      </div>
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <Card>
            <h5 className="mb-2">Quick actions</h5>
            <ul className="mb-0">
              <li>Create or view projects</li>
              <li>Check your assigned tasks</li>
              <li>Log your work hours</li>
            </ul>
          </Card>
        </div>
        <div className="col-12 col-lg-6">
          <Card>
            <h5 className="mb-2">What's next</h5>
            <p className="mb-0">We’ll add Projects/Tasks pages with filters, pagination and role-based actions.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
