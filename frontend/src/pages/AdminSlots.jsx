import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';

const today = () => new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD
const blank = { date: today(), time: '12:30', maxOrders: 10 };

// Admin: create / update capacity / activate / delete pickup slots
export default function AdminSlots() {
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState(blank);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = () =>
    api.get('/slots').then(({ data }) => setSlots(data.slots)).catch((e) => setMsg({ type: 'error', text: errMsg(e) }));
  useEffect(() => { load(); }, []);

  const wrap = async (fn, ok) => {
    setMsg({ type: '', text: '' });
    try {
      await fn();
      if (ok) setMsg({ type: 'success', text: ok });
      load();
    } catch (e) {
      setMsg({ type: 'error', text: errMsg(e) });
    }
  };

  const create = (e) => {
    e.preventDefault();
    wrap(() => api.post('/slots', { ...form, maxOrders: Number(form.maxOrders) }), 'Slot created');
  };

  const setCapacity = (s) => {
    const v = window.prompt(`New capacity for ${s.date} ${s.time} (current orders: ${s.currentOrders})`, s.maxOrders);
    if (v === null) return;
    wrap(() => api.put(`/slots/${s._id}`, { maxOrders: Number(v) }), 'Capacity updated');
  };

  return (
    <section>
      <h2>Manage pickup slots</h2>
      {msg.text && <p className={msg.type === 'error' ? 'error' : 'success'}>{msg.text}</p>}

      <form className="card row gap wrap" onSubmit={create}>
        <label>Date<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></label>
        <label>Time<input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required /></label>
        <label>Max orders<input type="number" min="1" value={form.maxOrders} onChange={(e) => setForm({ ...form, maxOrders: e.target.value })} required /></label>
        <button className="btn">Add slot</button>
      </form>

      <table className="table">
        <thead><tr><th>Date</th><th>Time</th><th>Booked</th><th>Capacity</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {slots.map((s) => (
            <tr key={s._id}>
              <td>{s.date}</td><td>{s.time}</td>
              <td>{s.currentOrders}</td><td>{s.maxOrders}</td>
              <td>{!s.isActive ? <span className="badge cancelled">closed</span> : s.isFull ? <span className="badge preparing">full</span> : <span className="badge ready">open</span>}</td>
              <td className="row gap">
                <button className="btn small" onClick={() => setCapacity(s)}>Capacity</button>
                <button className="btn small ghost" onClick={() => wrap(() => api.put(`/slots/${s._id}`, { isActive: !s.isActive }))}>
                  {s.isActive ? 'Close' : 'Open'}
                </button>
                <button className="btn small danger" onClick={() => window.confirm('Delete slot?') && wrap(() => api.delete(`/slots/${s._id}`), 'Slot deleted')}>Delete</button>
              </td>
            </tr>
          ))}
          {slots.length === 0 && <tr><td colSpan="6" className="muted">No slots yet.</td></tr>}
        </tbody>
      </table>
    </section>
  );
}
