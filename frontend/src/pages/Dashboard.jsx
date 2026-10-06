import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';

const CATEGORIES = ['all', 'breakfast', 'lunch', 'snacks', 'beverages', 'desserts'];

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [slots, setSlots] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState({}); // { menuItemId: quantity }
  const [slotId, setSlotId] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  const load = async () => {
    try {
      const [m, s] = await Promise.all([api.get('/menu-items'), api.get('/slots')]);
      setItems(m.data.items);
      setSlots(s.data.slots);
    } catch (err) {
      setMsg({ type: 'error', text: errMsg(err) });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const visible = useMemo(
    () =>
      items.filter(
        (i) =>
          (category === 'all' || i.category === category) &&
          i.name.toLowerCase().includes(search.toLowerCase())
      ),
    [items, category, search]
  );

  const cartLines = items.filter((i) => cart[i._id] > 0).map((i) => ({ ...i, quantity: cart[i._id] }));
  const total = cartLines.reduce((s, l) => s + l.price * l.quantity, 0);

  const change = (id, delta) =>
    setCart((c) => {
      const q = Math.min(10, Math.max(0, (c[id] || 0) + delta));
      const next = { ...c };
      if (q === 0) delete next[id]; else next[id] = q;
      return next;
    });

  const placeOrder = async () => {
    setMsg({ type: '', text: '' });
    if (!slotId) return setMsg({ type: 'error', text: 'Please choose a pickup slot' });
    if (!cartLines.length) return setMsg({ type: 'error', text: 'Your cart is empty' });
    setPlacing(true);
    try {
      const { data } = await api.post('/orders', {
        slotId,
        note,
        items: cartLines.map((l) => ({ menuItemId: l._id, quantity: l.quantity })),
      });
      nav(`/orders/${data.order._id}`);
    } catch (err) {
      setMsg({ type: 'error', text: errMsg(err) });
      load(); // refresh remaining capacity / availability
    } finally {
      setPlacing(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await api.delete(`/menu-items/${id}`);
      setItems((x) => x.filter((i) => i._id !== id));
    } catch (err) {
      setMsg({ type: 'error', text: errMsg(err) });
    }
  };

  const toggle = async (item) => {
    try {
      const { data } = await api.put(`/menu-items/${item._id}`, { isAvailable: !item.isAvailable });
      setItems((x) => x.map((i) => (i._id === item._id ? data.item : i)));
    } catch (err) {
      setMsg({ type: 'error', text: errMsg(err) });
    }
  };

  if (loading) return <p>Loading menu…</p>;

  return (
    <div className={isAdmin ? '' : 'two-col'}>
      <section>
        <div className="row between">
          <h2>{isAdmin ? 'Manage Menu' : 'Today’s Menu'}</h2>
          {isAdmin && <Link className="btn" to="/admin/menu/new">+ Add item</Link>}
        </div>

        {msg.text && <p className={msg.type === 'error' ? 'error' : 'success'}>{msg.text}</p>}

        <div className="filters">
          <input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="chips">
            {CATEGORIES.map((c) => (
              <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
            ))}
          </div>
        </div>

        {visible.length === 0 && <p className="muted">No items found.</p>}

        <div className="grid">
          {visible.map((item) => (
            <div key={item._id} className={`card item ${item.isAvailable ? '' : 'off'}`}>
              <div className="row between">
                <strong>{item.name}</strong>
                <span className="price">₹{item.price}</span>
              </div>
              <p className="muted">{item.description || '—'}</p>
              <small className="tag">{item.category}</small>
              {!item.isAvailable && <small className="tag red">Unavailable</small>}

              {isAdmin ? (
                <div className="row gap">
                  <Link className="btn small" to={`/admin/menu/${item._id}/edit`}>Edit</Link>
                  <button className="btn small ghost" onClick={() => toggle(item)}>
                    {item.isAvailable ? 'Mark unavailable' : 'Mark available'}
                  </button>
                  <button className="btn small danger" onClick={() => remove(item._id)}>Delete</button>
                </div>
              ) : (
                <div className="qty">
                  <button onClick={() => change(item._id, -1)} disabled={!cart[item._id]}>−</button>
                  <span>{cart[item._id] || 0}</span>
                  <button onClick={() => change(item._id, 1)} disabled={!item.isAvailable}>+</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {!isAdmin && (
        <aside className="card cart">
          <h3>Your order</h3>
          {cartLines.length === 0 ? (
            <p className="muted">Add items from the menu.</p>
          ) : (
            <ul>
              {cartLines.map((l) => (
                <li key={l._id}><span>{l.quantity} × {l.name}</span><span>₹{l.price * l.quantity}</span></li>
              ))}
            </ul>
          )}
          <div className="row between total"><strong>Total</strong><strong>₹{total}</strong></div>

          <label>Pickup slot
            <select value={slotId} onChange={(e) => setSlotId(e.target.value)}>
              <option value="">Select a slot…</option>
              {slots.map((s) => {
                const left = s.maxOrders - s.currentOrders;
                return (
                  <option key={s._id} value={s._id} disabled={left <= 0}>
                    {s.date} · {s.time} — {left > 0 ? `${left} left` : 'FULL'}
                  </option>
                );
              })}
            </select>
          </label>
          {slots.length === 0 && <p className="muted">No upcoming slots are open right now.</p>}

          <label>Note (optional)
            <input maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Less spicy, etc." />
          </label>

          <button className="btn block" onClick={placeOrder} disabled={placing}>
            {placing ? 'Placing…' : 'Place pre-order'}
          </button>
        </aside>
      )}
    </div>
  );
}
