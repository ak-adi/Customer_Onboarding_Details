import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../index.css';

const API = `http://${window.location.hostname}:5000`;

function statusBadge(status) {
  if (!status) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const cls = status === 'Dispatched' ? 'badge-success'
            : status === 'Hold'       ? 'badge-warning'
            : 'badge-danger';
  return <span className={`badge ${cls}`}>{status}</span>;
}

export default function AdminView() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [toast,   setToast]   = useState(null);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('admin_token');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/records`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      } else {
        showToast('Failed to fetch records', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await axios.delete(`${API}/api/admin/records/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(r => r.filter(x => x.id !== id));
      showToast('✅ Record deleted successfully');
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  // ── Excel Export (fixed) ─────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await axios.get(`${API}/api/admin/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer',   // use arraybuffer for binary data reliability
      });

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const today = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.setAttribute('download', `Customer_Onboarding_${today}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);   // cleanup memory
      showToast('📥 Excel report downloaded!');
    } catch (err) {
      console.error('Export error:', err);
      const msg = err.response?.status === 401 ? 'Session expired – please log in again'
                : err.response?.status === 403 ? 'Not authorized to export'
                : 'Failed to export Excel report';
      showToast(msg, 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const filtered = records.filter(r =>
    Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  // Stats
  const total      = records.length;
  const inProcess  = records.filter(r => r.order_status === 'In Process').length;
  const hold       = records.filter(r => r.order_status === 'Hold').length;
  const dispatched = records.filter(r => r.order_status === 'Dispatched').length;

  const cols = [
    { key: 'id',                  label: 'ID' },
    { key: 'sr_no',               label: 'Sr. No.' },
    { key: 'po_no',               label: 'PO No.' },
    { key: 'product_description', label: 'Product Description' },
    { key: 'po_date',             label: 'PO Date' },
    { key: 'card_quantity',       label: 'Card Qty' },
    { key: 'antenna_type',        label: 'Antenna Type' },
    { key: 'perso_type',          label: 'Perso Type' },
    { key: 'module_make',         label: 'Module Make' },
    { key: 'module_part_code',    label: 'Part Code' },
    { key: 'chip_atr',            label: 'Chip ATR' },
    { key: 'chip_ats',            label: 'Chip ATS' },
    { key: 'module_qty_sent',     label: 'Mod. Qty Sent' },
    { key: 'module_sent_date',    label: 'Sent Date' },
    { key: 'module_received_date',label: 'Received Date' },
    { key: 'cdd',                 label: 'CDD' },
    { key: 'order_status',        label: 'Status' },
    { key: 'submitted_at',        label: 'Submitted At' },
  ];

  return (
    <div className="page-wrapper">
      {/* Navbar */}
      <nav className="navbar">
        <a href="/" className="navbar-brand">
          <img src="/colorplast_exe_icon.png" alt="Colorplast Logo" className="brand-logo" />
          <div>
            <div>Customer Onboarding</div>
            <div className="navbar-title">Admin Panel</div>
          </div>
        </a>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600 }}>
            👤 Administrator
          </span>
          <button
            className="btn btn-ghost"
            style={{ fontSize: '0.8rem', padding: '8px 16px' }}
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
        </div>
      </nav>

      {/* Page Header */}
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>View, search, and manage all customer onboarding records</p>
      </div>

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 20px' }}>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-value">{total}</div>
            <div className="stat-label">Total Entries</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--danger-bg)' }}>⚙️</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{inProcess}</div>
            <div className="stat-label">In Process</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--warning-bg)' }}>⏸️</div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{hold}</div>
            <div className="stat-label">On Hold</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--success-bg)' }}>✅</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{dispatched}</div>
            <div className="stat-label">Dispatched</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <input
            type="text"
            className="form-input"
            style={{ maxWidth: 340 }}
            placeholder="🔍 Search any field..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="admin-search"
          />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              id="export-excel-btn"
              className="btn btn-success"
              style={{ fontSize: '0.82rem' }}
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting
                ? <><div className="spinner" style={{ borderTopColor: 'var(--success)' }}></div> Exporting...</>
                : '📥 Export Excel'}
            </button>
            <button
              className="btn btn-ghost"
              style={{ fontSize: '0.82rem' }}
              onClick={fetchRecords}
              disabled={loading}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 64, color: 'var(--text-muted)' }}>
              <div className="spinner" style={{
                margin: '0 auto 14px',
                width: 30, height: 30,
                borderWidth: 3,
                borderColor: 'var(--border)',
                borderTopColor: 'var(--accent)'
              }}></div>
              Loading records...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 64, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📭</div>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No records found</div>
              <div style={{ fontSize: '0.83rem', marginTop: 4 }}>
                {search ? 'Try a different search term' : 'Submit your first entry from the Dashboard'}
              </div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {cols.map(c => <th key={c.key}>{c.label}</th>)}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(row => (
                    <tr key={row.id}>
                      {cols.map(c => (
                        <td key={c.key}>
                          {c.key === 'order_status'
                            ? statusBadge(row[c.key])
                            : c.key === 'submitted_at'
                              ? (row[c.key] ? new Date(row[c.key]).toLocaleString() : '—')
                              : (row[c.key] || <span style={{ color: 'var(--text-muted)' }}>—</span>)
                          }
                        </td>
                      ))}
                      <td>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                          onClick={() => handleDelete(row.id)}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer count */}
        <div style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 500 }}>
          Showing <strong style={{ color: 'var(--accent-dark)' }}>{filtered.length}</strong> of <strong style={{ color: 'var(--accent-dark)' }}>{total}</strong> records
          {search && ` • Filtered by "${search}"`}
        </div>
      </div>

      {/* Toast */}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
