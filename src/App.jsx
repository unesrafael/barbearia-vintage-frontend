import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { ProtectedLayout } from './components/Layout.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { AgendaPage } from './pages/AgendaPage.jsx';
import { ClientsPage } from './pages/ClientsPage.jsx';
import { ServicesPage } from './pages/ServicesPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedLayout />}>
              <Route path="/agenda" element={<AgendaPage />} />
              <Route path="/clientes" element={<ClientsPage />} />
              <Route path="/servicos" element={<ServicesPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/agenda" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
