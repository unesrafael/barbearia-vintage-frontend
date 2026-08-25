import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export function ProtectedLayout() {
  const { user, checking, logout } = useAuth();

  if (checking) return <div className="loading">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <strong>Barbearia Vintage</strong>
          <span>Agenda interna</span>
        </div>

        <nav className="nav">
          <NavLink to="/agenda">Agenda</NavLink>
          <NavLink to="/clientes">Clientes</NavLink>
          <NavLink to="/servicos">Serviços</NavLink>
        </nav>

        <div className="sidebar-foot">
          <div className="who">
            <b>{user.name}</b>
            <span>{user.email}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout} style={{ borderColor: '#2b3038', background: 'transparent', color: '#b9bfcb' }}>
            Sair
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}

export function ErrorAlert({ message }) {
  if (!message) return null;
  return (
    <div className="alert" role="alert" style={{ marginBottom: 16 }}>
      {message}
    </div>
  );
}
