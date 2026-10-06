import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { errMsg } from '../api';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', adminCode: '' });
  const [showAdmin, setShowAdmin] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setBusy(true);
    try {
      const payload = { name: form.name, email: form.email, password: form.password };
      if (showAdmin && form.adminCode) payload.adminCode = form.adminCode;
      await register(payload);
      nav('/');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card auth" onSubmit={submit}>
      <h2>Create account</h2>
      {error && <p className="error">{error}</p>}
      <label>Name<input required value={form.name} onChange={set('name')} /></label>
      <label>Email<input type="email" required value={form.email} onChange={set('email')} /></label>
      <label>Password<input type="password" required value={form.password} onChange={set('password')} /></label>
      <label className="check">
        <input type="checkbox" checked={showAdmin} onChange={(e) => setShowAdmin(e.target.checked)} />
        I am canteen staff (have an admin code)
      </label>
      {showAdmin && <label>Admin invite code<input value={form.adminCode} onChange={set('adminCode')} /></label>}
      <button className="btn" disabled={busy}>{busy ? 'Creating…' : 'Register'}</button>
      <p className="muted">Already registered? <Link to="/login">Login</Link></p>
    </form>
  );
}
