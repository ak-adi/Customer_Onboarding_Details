import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../index.css';

const API = `http://${window.location.hostname}:5000`;

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const passwordRef = useRef(null);
  const submitRef = useRef(null);

  // Enter-key navigation: username → password → submit
  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'username') {
        passwordRef.current?.focus();
      } else if (field === 'password') {
        // Trigger form submission
        submitRef.current?.click();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/login`, form);
      localStorage.setItem('admin_token', res.data.token);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* Logo / Header */}
        <div className="login-logo">
          <div className="icon">🔐</div>
          <h2>Admin Portal</h2>
          <p>Sign in to view and manage customer onboarding entries</p>
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
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="form-input"
              placeholder="Enter admin username"
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              onKeyDown={e => handleKeyDown(e, 'username')}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 26 }}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              ref={passwordRef}
              type="password"
              className="form-input"
              placeholder="Enter password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              onKeyDown={e => handleKeyDown(e, 'password')}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            ref={submitRef}
            type="submit"
            className="btn btn-primary"
            id="login-submit-btn"
            style={{ width: '100%', justifyContent: 'center', padding: '13px' }}
            disabled={loading}
          >
            {loading ? <><div className="spinner"></div> Signing in...</> : '🔓 Sign In'}
          </button>
        </form>

        {/* Hint */}


        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a
            href="/"
            style={{ color: 'var(--accent)', fontSize: '0.83rem', textDecoration: 'none', fontWeight: 500 }}
          >
            ← Back to Customer Onboarding Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
