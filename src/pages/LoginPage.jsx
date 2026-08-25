import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { TextField } from '../components/Field.jsx';
import { ErrorAlert } from '../components/Layout.jsx';
import { readError } from '../api/client.js';

export function LoginPage() {
  const { user, checking, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(params.get('expirada') ? 'Sua sessão expirou. Entre novamente.' : '');
  const [busy, setBusy] = useState(false);

  if (checking) return <div className="loading">Carregando...</div>;
  if (user) return <Navigate to="/agenda" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      navigate('/agenda', { replace: true });
    } catch (err) {
      setError(readError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <div className="login-card">
        <div className="pole" />
        <div className="inner">
          <div className="mark">Barbearia Vintage</div>
          <div className="sub">Sistema de agendamentos</div>

          <ErrorAlert message={error} />

          <form onSubmit={submit} className="form-grid">
            <TextField
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
            <TextField
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="demo-hint">
            Acesso de teste — <code>marcelo@barbeariavintage.com</code> / <code>vintage123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
