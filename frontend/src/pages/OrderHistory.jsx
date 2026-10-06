import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';

const STATUSES = ['all', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];

export default function OrderHistory() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/orders', { params: status === 'all' ? {} : { status } })
      .then(({ data }) => setOrders(data.orders))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <section>
      <h2>{isAdmin ? 'All orders' : 'My order history'}</h2>
      {error && <p className="error">{error}</p>}
      <div className="chips">
        {STATUSES.map((s) => (
          <button key={s} className={`chip ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>{s}</button>
        ))}
      </div>
      {loading ? <p>Loading…</p> : orders.length === 0 ? <p className="muted">No orders found.</p> : (
        <table className="table">
          <thead>
            <tr><th>Order</th>{isAdmin && <th>Student</th>}<th>Pickup slot</th><th>Items</th><th>Total</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td>#{o._id.slice(-6).toUpperCase()}</td>
                {isAdmin && <td>{o.student?.name}</td>}
                <td>{o.slot ? `${o.slot.date} ${o.slot.time}` : '—'}</td>
                <td>{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                <td>₹{o.totalAmount}</td>
                <td><span className={`badge ${o.status}`}>{o.status}</span></td>
                <td><Link to={`/orders/${o._id}`}>Details</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
