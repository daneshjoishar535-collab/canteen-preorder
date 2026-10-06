import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const nav = useNavigate();

  return (
    <header className="navbar">
      <Link to="/" className="brand">🍽️ Campus Canteen</Link>
      <nav>
        {user ? (
          <>
            <NavLink to="/" end>{isAdmin ? 'Menu' : 'Order Food'}</NavLink>
            <NavLink to="/orders">{isAdmin ? 'All Orders' : 'My Orders'}</NavLink>
            {isAdmin && <NavLink to="/admin/slots">Slots</NavLink>}
            <span className="who">{user.name} <small>({user.role})</small></span>
            <button className="btn ghost" onClick={() => { logout(); nav('/login'); }}>Logout</button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
