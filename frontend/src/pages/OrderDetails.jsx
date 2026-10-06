import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';

// Allowed next states for admin (mirrors backend state machine)
const NEXT = { confirmed: ['preparing', 'cancelled'], preparing: ['ready'], ready: ['completed'], completed: [], cancelled: [] };

export default function OrderDetails() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data.order)).catch((e) => setError(errMsg(e)));
  }, [id]);

  const act = async (req) => {
    setBusy(true);
    setError('');
    try {
      const { data } = await req();
      setOrder(data.order);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  if (error && !order) return <p className="error">{error}</p>;
  if (!order) return <p>Loading…</p>;

  return (
    <section className="card details">
      <div className="row between">
        <h2>Order #{order._id.slice(-6).toUpperCase()}</h2>
        <span className={`badge ${order.status}`}>{order.status}</span>
      </div>
      {error && <p className="error">{error}</p>}

      <p><strong>Pickup:</strong> {order.slot?.date} at {order.slot?.time}</p>
      {isAdmin && <p><strong>Student:</strong> {order.student?.name} ({order.student?.email})</p>}
      <p><strong>Placed:</strong> {new Date(order.createdAt).toLocaleString()}</p>
      {order.note && <p><strong>Note:</strong> {order.note}</p>}

      <table className="table">
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.menuItem}><td>{i.name}</td><td>{i.quantity}</td><td>₹{i.price}</td><td>₹{i.price * i.quantity}</td></tr>
          ))}
        </tbody>
        <tfoot><tr><td colSpan="3"><strong>Total</strong></td><td><strong>₹{order.totalAmount}</strong></td></tr></tfoot>
      </table>

      <div className="row gap">
        {!isAdmin && order.status === 'confirmed' && (
          <button className="btn danger" disabled={busy} onClick={() => window.confirm('Cancel this order?') && act(() => api.patch(`/orders/${id}/cancel`))}>
            Cancel order
          </button>
        )}
        {isAdmin && NEXT[order.status].map((s) => (
          <button key={s} className={`btn ${s === 'cancelled' ? 'danger' : ''}`} disabled={busy}
            onClick={() => act(() => api.patch(`/orders/${id}/status`, { status: s }))}>
            Mark {s}
          </button>
        ))}
        <Link className="btn ghost" to="/orders">Back to orders</Link>
      </div>
    </section>
  );
}
