import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import CmsDashboard from './pages/CmsDashboard';
import ColorplastDashboard from './pages/ColorplastDashboard';
import AdminView from './pages/AdminView';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('admin_token');
  const role = localStorage.getItem('auth_role') || (localStorage.getItem('admin_token') ? 'admin' : null);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role) && role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RootRedirect() {
  const token = localStorage.getItem('auth_token');
  const role = localStorage.getItem('auth_role');

  if (!token) return <Navigate to="/login" replace />;
  if (role === 'cms') return <Navigate to="/cms/dashboard" replace />;
  if (role === 'colorplast') return <Navigate to="/colorplast/dashboard" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        
        {/* CMS Dashboard */}
        <Route
          path="/cms/dashboard"
          element={
            <ProtectedRoute allowedRoles={['cms', 'admin']}>
              <CmsDashboard />
            </ProtectedRoute>
          }
        />

        {/* Colorplast Dashboard */}
        <Route
          path="/colorplast/dashboard"
          element={
            <ProtectedRoute allowedRoles={['colorplast', 'admin']}>
              <ColorplastDashboard />
            </ProtectedRoute>
          }
        />

        {/* Super Admin Panel */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminView />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
