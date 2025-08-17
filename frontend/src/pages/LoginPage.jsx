import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    const res = await login(form);
    if (res.ok) navigate('/dashboard');
    else setErr(res?.error?.message || 'Invalid credentials');
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-5">
          <Card>
            <h3 className="mb-3">Welcome back</h3>
            <p className="text-muted">Sign in to manage your projects and tasks.</p>
            {err && <div className="alert alert-danger">{err}</div>}
            <form onSubmit={onSubmit}>
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <Button disabled={loading} className="w-100">
                {loading ? 'Signing in…' : 'Login'}
              </Button>
            </form>
            <div className="mt-3">
              <span className="small link-muted">Don’t have an account?</span>{' '}
              <Link to="/register">Create one</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
