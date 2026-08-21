import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import '../index.css';

const API = `http://${window.location.hostname}:5000`;

const DEFAULT_ATR_ATS = [
  { make: "NXP JCOP4 B75B", atr: "3B6A00FF0031C173C84000009000", ats: "0F788071020031C173C84000009000" },
  { make: "NXP JCOP4 B86A", atr: "3B6A00FF0031C173C84000009000", ats: "0F788071020031C173C84000009000" },
  { make: "NXP JCOP5 BA5C", atr: "3BFA1300FF10000031C173C84000009000", ats: "0F788071020031C173C84000009000" },
  { make: "NXP JCOP5 BACD", atr: "3BFA1300FF10000031C173C84000009000", ats: "0F788071020031C173C84000009000" },
];

export default function EntryModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
  role = 'general',
  schema = [],
  atrAts = DEFAULT_ATR_ATS
}) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoFilled, setAutoFilled] = useState({ chip_atr: false, chip_ats: false });

  const fieldOrder = useRef([]);
  const fieldRefs = useRef({});

  const isEdit = Boolean(initialData && initialData.id);

  // Initialize form whenever modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      setError('');
      if (isEdit) {
        const prefilled = { ...initialData };
        // Normalize any nulls to empty strings
        schema.forEach(f => {
          if (prefilled[f.key] === null || prefilled[f.key] === undefined) {
            prefilled[f.key] = '';
          }
        });
        setForm(prefilled);
      } else {
        const fresh = { role_id: role };
        schema.forEach(f => { fresh[f.key] = ''; });
        // Set default order status
        fresh.order_status = 'In Process';
        setForm(fresh);
      }
      fieldOrder.current = schema.map(f => f.key);
      setAutoFilled({ chip_atr: false, chip_ats: false });
    }
  }, [isOpen, initialData, schema, role, isEdit]);

  // Handle field input changes
  const handleChange = useCallback((key, value) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };

      if (key === 'module_make') {
        const match = atrAts.find(m => m.make === value);
        if (match) {
          next.chip_atr = match.atr;
          next.chip_ats = match.ats;
          setAutoFilled({ chip_atr: true, chip_ats: true });
        } else {
          setAutoFilled(af => {
            if (af.chip_atr) next.chip_atr = '';
            if (af.chip_ats) next.chip_ats = '';
            return { chip_atr: false, chip_ats: false };
          });
        }
      }

      if (key === 'chip_atr') setAutoFilled(af => ({ ...af, chip_atr: false }));
      if (key === 'chip_ats') setAutoFilled(af => ({ ...af, chip_ats: false }));

      return next;
    });
  }, [atrAts]);

  // Enter key navigation between fields
  const handleKeyDown = useCallback((e, currentKey) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const order = fieldOrder.current;
      const idx = order.indexOf(currentKey);
      for (let i = idx + 1; i < order.length; i++) {
        const el = fieldRefs.current[order[i]];
        if (el) {
          el.focus();
          return;
        }
      }
    }
  }, []);

  const setRef = useCallback((key) => (el) => {
    fieldRefs.current[key] = el;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    const missing = schema.filter(f => f.required && !form[f.key]);
    if (missing.length) {
      setError(`Required fields missing: ${missing.map(m => m.label).join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await axios.put(`${API}/api/records/${initialData.id}`, {
          ...form,
          role_id: form.role_id || role
        });
        onSuccess(isEdit ? 'Record updated successfully!' : 'Entry created successfully!');
      } else {
        await axios.post(`${API}/api/submit`, {
          ...form,
          role_id: role
        });
        onSuccess('New customer onboarding entry created successfully!');
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || (isEdit ? 'Failed to update record' : 'Failed to save entry'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const sections = [
    { title: '📋 Order Information', keys: ['sr_no', 'po_no', 'product_description', 'po_date', 'card_quantity', 'order_status'] },
    { title: '📡 Technical Specifications', keys: ['antenna_type', 'perso_type', 'module_make', 'module_part_code', 'chip_atr', 'chip_ats'] },
    { title: '🚚 Module Tracking & Dates', keys: ['module_qty_sent', 'module_sent_date', 'module_received_date', 'cdd'] },
  ];

  const fieldByKey = {};
  schema.forEach(f => { fieldByKey[f.key] = f; });

  const renderField = (field) => {
    if (!field) return null;
    const { key, label, type, required, options } = field;
    const isAutoFill = autoFilled[key];

    if (type === 'select') {
      return (
        <div className="form-group" key={key}>
          <label htmlFor={`modal-${key}`}>
            {label}{required && <span className="required">*</span>}
          </label>
          <select
            id={`modal-${key}`}
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
            <span className="auto-fill-note">⚡ ATR &amp; ATS auto-filled</span>
          )}
        </div>
      );
    }

    return (
      <div className="form-group" key={key}>
        <label htmlFor={`modal-${key}`}>
          {label}{required && <span className="required">*</span>}
        </label>
        <input
          id={`modal-${key}`}
          ref={setRef(key)}
          type={type}
          className={`form-input${isAutoFill ? ' auto-filled' : ''}`}
          value={form[key] || ''}
          onChange={e => handleChange(key, e.target.value)}
          onKeyDown={e => handleKeyDown(e, key)}
          placeholder={`Enter ${label}`}
        />
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2>
            {isEdit ? '✏️ Edit Customer Onboarding Record' : '➕ New Customer Onboarding Entry'}
            <span className={`badge badge-role-${role}`} style={{ marginLeft: 8 }}>
              {role.toUpperCase()}
            </span>
          </h2>
          <button type="button" className="modal-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {error && (
            <div className="error-box" style={{ marginBottom: 20 }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form id="entry-modal-form" onSubmit={handleSubmit} noValidate>
            {sections.map(sec => (
              <div key={sec.title} style={{ marginBottom: 18 }}>
                <div className="section-title" style={{ fontSize: '0.86rem', marginBottom: 10 }}>
                  {sec.title}
                </div>
                <div className="card" style={{ padding: '16px', background: '#fbfcfd' }}>
                  <div className="form-grid">
                    {sec.keys.map(k => renderField(fieldByKey[k]))}
                  </div>
                </div>
              </div>
            ))}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="entry-modal-form"
            className="btn btn-primary"
            disabled={loading}
            id="modal-submit-btn"
          >
            {loading ? (
              <><div className="spinner"></div> Saving...</>
            ) : isEdit ? (
              '💾 Update Record'
            ) : (
              '💾 Save Entry'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
