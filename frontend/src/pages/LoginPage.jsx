import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../index.css';

const API = `http://${window.location.hostname}:5000`;

const ROLES = [
  { id: 'cms', label: 'CMS Portal', icon: '💼', desc: 'CMS Client & Partner Orders' },
  { id: 'colorplast', label: 'Colorplast', icon: '🏢', desc: 'Colorplast Internal Operations' },
  { id: 'admin', label: 'Admin', icon: '🔐', desc: 'System Administration' },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState('cms');
  const [username, setUsername] = useState('cms');
  const [password, setPassword] = useState('cms@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const passwordRef = useRef(null);
  const submitRef = useRef(null);

  const handleRoleChange = (roleId) => {
    setSelectedRole(roleId);
    setError('');
    if (roleId === 'cms') {
      setUsername('cms');
      setPassword('cms@123');
    } else if (roleId === 'colorplast') {
      setUsername('colorplast');
      setPassword('color@123');
    } else if (roleId === 'admin') {
      setUsername('admin');
      setPassword('admin@123');
    }
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'username') {
        passwordRef.current?.focus();
      } else if (field === 'password') {
        submitRef.current?.click();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API}/api/auth/login`, {
        username,
        password,
        role: selectedRole
      });

      // Save user session
      localStorage.setItem('auth_token', res.data.token);
      localStorage.setItem('auth_role', res.data.role);
      localStorage.setItem('auth_user', res.data.username);
      localStorage.setItem('auth_name', res.data.roleName);

      // Legacy token compatibility for admin
      if (res.data.role === 'admin') {
        localStorage.setItem('admin_token', res.data.token);
      }

      // Redirect to appropriate role dashboard
      if (res.data.role === 'cms') {
        navigate('/cms/dashboard');
      } else if (res.data.role === 'colorplast') {
        navigate('/colorplast/dashboard');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card" style={{ maxWidth: 460 }}>
        {/* Logo / Header */}
        <div className="login-logo">
          <img
            src="/colorplast_exe_icon.png"
            alt="Logo"
            style={{ width: 56, height: 56, objectFit: 'contain', margin: '0 auto 12px', display: 'block' }}
          />
          <h2>Customer Onboarding Portal</h2>
          <p>Select your portal role to access your dedicated dashboard</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="role-tabs">
          {ROLES.map(r => (
            <button
              key={r.id}
              type="button"
              className={`role-tab-btn ${selectedRole === r.id ? 'active' : ''}`}
              onClick={() => handleRoleChange(r.id)}
            >
              <span className="role-icon">{r.icon}</span>
              <span className="role-label">{r.label}</span>
            </button>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="error-box">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label htmlFor="login-username">
              Username for <strong style={{ color: 'var(--accent-dark)' }}>{ROLES.find(r => r.id === selectedRole)?.label}</strong>
            </label>
            <input
              id="login-username"
              type="text"
              className="form-input"
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'username')}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="login-password">Password</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {showPassword ? 'Hide 👁️' : 'Show 👁️'}
              </button>
            </div>
            <input
              id="login-password"
              ref={passwordRef}
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'password')}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            ref={submitRef}
            type="submit"
            className="btn btn-primary"
            id="portal-login-btn"
            style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.92rem' }}
            disabled={loading}
          >
            {loading ? (
              <><div className="spinner"></div> Authenticating...</>
            ) : (
              `🔓 Sign In to ${ROLES.find(r => r.id === selectedRole)?.label}`
            )}
          </button>
        </form>

        {/* Demo Accounts Bar */}
        <div className="demo-accounts-bar">
          <div className="demo-title">⚡ Quick Test Accounts</div>
          <div className="demo-btn-group">
            <button
              type="button"
              className="demo-chip"
              onClick={() => handleRoleChange('cms')}
            >
              💼 CMS (cms)
            </button>
            <button
              type="button"
              className="demo-chip"
              onClick={() => handleRoleChange('colorplast')}
            >
              🏢 Colorplast (colorplast)
            </button>
            <button
              type="button"
              className="demo-chip"
              onClick={() => handleRoleChange('admin')}
            >
              🔐 Admin (admin)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
