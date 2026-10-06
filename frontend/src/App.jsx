import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MenuForm from './pages/MenuForm';
import OrderHistory from './pages/OrderHistory';
import OrderDetails from './pages/OrderDetails';
import AdminSlots from './pages/AdminSlots';

function Private({ children, adminOnly }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Private><Dashboard /></Private>} />
          <Route path="/orders" element={<Private><OrderHistory /></Private>} />
          <Route path="/orders/:id" element={<Private><OrderDetails /></Private>} />
          <Route path="/admin/menu/new" element={<Private adminOnly><MenuForm /></Private>} />
          <Route path="/admin/menu/:id/edit" element={<Private adminOnly><MenuForm /></Private>} />
          <Route path="/admin/slots" element={<Private adminOnly><AdminSlots /></Private>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
