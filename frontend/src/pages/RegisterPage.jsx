import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [err, setErr] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'employee',
    position: '',
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    if (form.password !== form.password_confirmation) {
      setErr('Passwords do not match');
      return;
    }
    const res = await register(form);
    if (res.ok) navigate('/dashboard');
    else setErr(res?.error?.message || 'Registration failed');
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-7 col-lg-6">
          <Card>
            <h3 className="mb-3">Create account</h3>
            {err && <div className="alert alert-danger">{err}</div>}
            <form onSubmit={onSubmit}>
              <Input label="Full name" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} required />
              <Input label="Email" type="email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} required />
              <div className="row">
                <div className="col-md-6">
                  <Input label="Password" type="password" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} required />
                </div>
                <div className="col-md-6">
                  <Input label="Confirm password" type="password" value={form.password_confirmation} onChange={(e)=>setForm({...form, password_confirmation: e.target.value})} required />
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Role</label>
                  <select className="form-select" value={form.role} onChange={(e)=>setForm({...form, role: e.target.value})}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <Input label="Position (optional)" value={form.position} onChange={(e)=>setForm({...form, position: e.target.value})} />
                </div>
              </div>

              <Button disabled={loading} className="w-100 mt-3">{loading ? 'Creating…' : 'Register'}</Button>
            </form>
            <div className="mt-3">
              <span className="small link-muted">Already have an account?</span>{' '}
              <Link to="/login">Login</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
