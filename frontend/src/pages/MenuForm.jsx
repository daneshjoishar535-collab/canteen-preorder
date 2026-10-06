import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api, { errMsg } from '../api';

const empty = { name: '', description: '', price: '', category: 'snacks', isAvailable: true };

// Add / Update form for menu items (admin only). Same component for both modes.
export default function MenuForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const nav = useNavigate();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.get(`/menu-items/${id}`)
      .then(({ data }) => setForm({ ...empty, ...data.item }))
      .catch((e) => setError(errMsg(e)));
  }, [id, editing]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const price = Number(form.price);
    if (!form.name.trim()) return setError('Name is required');
    if (form.price === '' || Number.isNaN(price) || price < 0) return setError('Enter a valid price');
    setBusy(true);
    try {
      const body = { name: form.name.trim(), description: form.description, price, category: form.category, isAvailable: form.isAvailable };
      if (editing) await api.put(`/menu-items/${id}`, body);
      else await api.post('/menu-items', body);
      nav('/');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card auth" onSubmit={submit}>
      <h2>{editing ? 'Update menu item' : 'Add menu item'}</h2>
      {error && <p className="error">{error}</p>}
      <label>Name<input value={form.name} onChange={set('name')} required /></label>
      <label>Description<textarea rows={3} value={form.description} onChange={set('description')} /></label>
      <label>Price (₹)<input type="number" min="0" step="0.5" value={form.price} onChange={set('price')} required /></label>
      <label>Category
        <select value={form.category} onChange={set('category')}>
          {['breakfast', 'lunch', 'snacks', 'beverages', 'desserts'].map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>
      <label className="check"><input type="checkbox" checked={form.isAvailable} onChange={set('isAvailable')} /> Available for ordering</label>
      <div className="row gap">
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : editing ? 'Update' : 'Create'}</button>
        <Link className="btn ghost" to="/">Cancel</Link>
      </div>
    </form>
  );
}
