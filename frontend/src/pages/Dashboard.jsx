import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import '../index.css';

const API = `http://${window.location.hostname}:5000`;

// ATR/ATS lookup — loaded from backend, fallback inline
const DEFAULT_ATR_ATS = [
  { make: "NXP JCOP4 B75B", atr: "3B6A00FF0031C173C84000009000", ats: "0F788071020031C173C84000009000" },
  { make: "NXP JCOP4 B86A", atr: "3B6A00FF0031C173C84000009000", ats: "0F788071020031C173C84000009000" },
  { make: "NXP JCOP5 BA5C", atr: "3BFA1300FF10000031C173C84000009000", ats: "0F788071020031C173C84000009000" },
  { make: "NXP JCOP5 BACD", atr: "3BFA1300FF10000031C173C84000009000", ats: "0F788071020031C173C84000009000" },
];

const statusBadge = (status) => {
  if (!status) return null;
  const cls = status === 'Dispatched' ? 'badge-success'
    : status === 'Hold' ? 'badge-warning'
      : 'badge-danger';
  return <span className={`badge ${cls}`}>{status}</span>;
};

export default function Dashboard() {
  const [schema, setSchema] = useState([]);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [atrAts, setAtrAts] = useState(DEFAULT_ATR_ATS);
  const [autoFilled, setAutoFilled] = useState({ chip_atr: false, chip_ats: false });

  // Ordered list of all field keys (for Enter-key tab-order)
  const fieldOrder = useRef([]);
  // Refs map: key → DOM element
  const fieldRefs = useRef({});

  useEffect(() => {
    axios.get(`${API}/api/schema`).then(r => {
      setSchema(r.data);
      const init = {};
      r.data.forEach(f => { init[f.key] = ''; });
      setForm(init);
      fieldOrder.current = r.data.map(f => f.key);
    }).catch(() => showToast('Failed to load form schema', 'error'));

    axios.get(`${API}/api/module-atr-ats`).then(r => setAtrAts(r.data)).catch(() => { });
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  // ── Field change handler ─────────────────────────────
  const handleChange = useCallback((key, value) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };

      // Auto-populate ATR / ATS when Module Make is chosen
      if (key === 'module_make') {
        const entry = atrAts.find(m => m.make === value);
        if (entry) {
          next.chip_atr = entry.atr;
          next.chip_ats = entry.ats;
          setAutoFilled({ chip_atr: true, chip_ats: true });
        } else {
          // Cleared: only reset if they were auto-filled
          setAutoFilled(af => {
            if (af.chip_atr) next.chip_atr = '';
            if (af.chip_ats) next.chip_ats = '';
            return { chip_atr: false, chip_ats: false };
          });
        }
      }

      // If user manually edits ATR/ATS, clear the auto-filled flag
      if (key === 'chip_atr') setAutoFilled(af => ({ ...af, chip_atr: false }));
      if (key === 'chip_ats') setAutoFilled(af => ({ ...af, chip_ats: false }));

      return next;
    });
  }, [atrAts]);

  // ── Enter key → focus next field ────────────────────
  const handleKeyDown = useCallback((e, currentKey) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const order = fieldOrder.current;
      const idx = order.indexOf(currentKey);
      // Find the next focusable field
      for (let i = idx + 1; i < order.length; i++) {
        const el = fieldRefs.current[order[i]];
        if (el) { el.focus(); return; }
      }
      // Last field → stay (don't submit)
    }
  }, []);

  // ── Register a ref ───────────────────────────────────
  const setRef = useCallback((key) => (el) => {
    fieldRefs.current[key] = el;
  }, []);

  // ── Submit ───────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const missing = schema.filter(f => f.required && !form[f.key]);
    if (missing.length) {
      showToast(`Please fill required fields: ${missing.map(m => m.label).join(', ')}`, 'error');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/api/submit`, form);
      showToast('✅ Entry saved successfully!', 'success');
      const reset = {};
      schema.forEach(f => { reset[f.key] = ''; });
      setForm(reset);
      setAutoFilled({ chip_atr: false, chip_ats: false });
    } catch (err) {
      showToast(err.response?.data?.error || 'Submission failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const reset = {};
    schema.forEach(f => { reset[f.key] = ''; });
    setForm(reset);
    setAutoFilled({ chip_atr: false, chip_ats: false });
  };

  // ── Field sections ───────────────────────────────────
  const sections = [
    { title: '📋 Order Information', keys: ['sr_no', 'po_no', 'product_description', 'po_date', 'card_quantity', 'order_status'] },
    { title: '📡 Technical Specifications', keys: ['antenna_type', 'perso_type', 'module_make', 'module_part_code', 'chip_atr', 'chip_ats'] },
    { title: '🚚 Module Tracking', keys: ['module_qty_sent', 'module_sent_date', 'module_received_date', 'cdd'] },
  ];

  const fieldByKey = {};
  schema.forEach(f => { fieldByKey[f.key] = f; });

  // ── Render one field ─────────────────────────────────
  const renderField = (field) => {
    if (!field) return null;
    const { key, label, type, required, options } = field;

    const isAutoFill = autoFilled[key];

    if (type === 'select') {
      return (
        <div className="form-group" key={key}>
          <label htmlFor={key}>
            {label}{required && <span className="required">*</span>}
          </label>
          <select
            id={key}
            ref={setRef(key)}
            className={`form-select${isAutoFill ? ' auto-filled' : ''}`}
            value={form[key] || ''}
            onChange={e => handleChange(key, e.target.value)}
            onKeyDown={e => handleKeyDown(e, key)}
          >
            <option value="">— Select —</option>
            {(options || []).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {key === 'module_make' && form[key] && (
            <span className="auto-fill-note">⚡ ATR &amp; ATS auto-filled below</span>
          )}
        </div>
      );
    }

    return (
      <div className="form-group" key={key}>
        <label htmlFor={key}>
          {label}{required && <span className="required">*</span>}
        </label>
        <input
          id={key}
          ref={setRef(key)}
          type={type}
          className={`form-input${isAutoFill ? ' auto-filled' : ''}`}
          value={form[key] || ''}
          onChange={e => handleChange(key, e.target.value)}
          onKeyDown={e => handleKeyDown(e, key)}
          placeholder={`Enter ${label}`}
        />
        {isAutoFill}
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      {/* Navbar */}
      <nav className="navbar">
        <a href="/" className="navbar-brand">
          <img src="/colorplast_exe_icon.png" alt="Colorplast Logo" className="brand-logo" />
          <div>
            <div>Customer Onboarding Details</div>

          </div>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

          <a href="/admin/login" className="btn btn-ghost" style={{ fontSize: '0.82rem', padding: '8px 18px' }}>
            🔐 Admin
          </a>
        </div>
      </nav>

      {/* Header */}
      <div className="page-header">
        <h1>New Customer Onboarding Entry</h1>
        <p>Fill in the order and module details below. Fields marked <span style={{ color: 'var(--danger)', fontWeight: 700 }}>*</span> are required.</p>
      </div>

      {/* Form */}
      <div className="form-container">
        <form onSubmit={handleSubmit} noValidate>
          {sections.map(sec => (
            <div key={sec.title}>
              <div className="section-title">{sec.title}</div>
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="form-grid">
                  {sec.keys.map(k => renderField(fieldByKey[k]))}
                </div>
              </div>
            </div>
          ))}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleReset}
              tabIndex={-1}
            >
              🔄 Reset Form
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              id="submit-btn"
            >
              {loading ? <><div className="spinner"></div> Saving...</> : '💾 Save Entry'}
            </button>
          </div>
        </form>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
