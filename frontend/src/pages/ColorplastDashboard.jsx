import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import EntryModal from '../components/EntryModal';
import '../index.css';

const API = `http://${window.location.hostname}:5000`;

function statusBadge(status) {
  if (!status) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const cls = status === 'Dispatched' ? 'badge-success'
            : status === 'Hold'       ? 'badge-warning'
            : 'badge-danger';
  return <span className={`badge ${cls}`}>{status}</span>;
}

export default function ColorplastDashboard() {
  const [records, setRecords] = useState([]);
  const [schema, setSchema] = useState([]);
  const [atrAts, setAtrAts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  const navigate = useNavigate();
  const userName = localStorage.getItem('auth_user') || 'Colorplast Team';

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/records?role=colorplast`);
      setRecords(res.data);
    } catch (err) {
      showToast('Failed to load records from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    axios.get(`${API}/api/schema`).then(r => setSchema(r.data)).catch(() => {});
    axios.get(`${API}/api/module-atr-ats`).then(r => setAtrAts(r.data)).catch(() => {});
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleOpenNew = () => {
    setEditRecord(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditRecord(record);
    setModalOpen(true);
  };

  const handleModalSuccess = (msg) => {
    showToast(msg, 'success');
    fetchRecords();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await axios.get(`${API}/api/export?role=colorplast`, {
        responseType: 'arraybuffer'
      });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const today = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.setAttribute('download', `Colorplast_Submissions_${today}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('📥 Colorplast Excel report downloaded!');
    } catch (err) {
      showToast('Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_name');
    navigate('/login');
  };

  const filtered = records.filter(r =>
    Object.values(r).some(v => String(v || '').toLowerCase().includes(search.toLowerCase()))
  );

  const total = records.length;
  const inProcess = records.filter(r => r.order_status === 'In Process').length;
  const hold = records.filter(r => r.order_status === 'Hold').length;
  const dispatched = records.filter(r => r.order_status === 'Dispatched').length;

  const cols = [
    { key: 'id', label: 'ID' },
    { key: 'sr_no', label: 'Sr. No.' },
    { key: 'po_no', label: 'PO No.' },
    { key: 'product_description', label: 'Product Description' },
    { key: 'po_date', label: 'PO Date' },
    { key: 'card_quantity', label: 'Card Qty' },
    { key: 'antenna_type', label: 'Antenna' },
    { key: 'perso_type', label: 'Perso Type' },
    { key: 'module_make', label: 'Module Make' },
    { key: 'module_part_code', label: 'Part Code' },
    { key: 'chip_atr', label: 'Chip ATR' },
    { key: 'chip_ats', label: 'Chip ATS' },
    { key: 'module_qty_sent', label: 'Mod Qty' },
    { key: 'module_sent_date', label: 'Sent Date' },
    { key: 'module_received_date', label: 'Recv Date' },
    { key: 'cdd', label: 'CDD' },
    { key: 'order_status', label: 'Status' },
    { key: 'submitted_at', label: 'Submitted At' },
  ];

  return (
    <div className="page-wrapper">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <img src="/colorplast_exe_icon.png" alt="Colorplast Logo" className="brand-logo" />
          <div>
            <div>Colorplast Operations Portal</div>
            <div className="navbar-title">Customer Onboarding &amp; Processing Details</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="badge-role-colorplast">
            🏢 {userName} (Colorplast Role)
          </span>
          <button
            className="btn btn-ghost"
            style={{ fontSize: '0.8rem', padding: '7px 14px' }}
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
        </div>
      </nav>

      {/* Page Header */}
      <div className="page-header">
        <h1>Colorplast Processing Dashboard</h1>
        <p>Real-time customer onboarding tracker, module configuration, and PO management.</p>
      </div>

      <div style={{ maxWidth: 1480, margin: '0 auto', padding: '0 20px' }}>
        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-value">{total}</div>
            <div className="stat-label">Total Colorplast Records</div>
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
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, maxWidth: 440 }}>
            <input
              type="text"
              className="form-input"
              placeholder="🔍 Search PO, make, part code, status..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="colorplast-search"
            />
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              id="colorplast-new-entry-btn"
              className="btn btn-primary"
              style={{ fontSize: '0.86rem', fontWeight: 700 }}
              onClick={handleOpenNew}
            >
              ➕ New Entry
            </button>

            <button
              id="colorplast-export-btn"
              className="btn btn-success"
              style={{ fontSize: '0.82rem' }}
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <><div className="spinner" style={{ borderTopColor: 'var(--success)' }}></div> Exporting...</>
              ) : (
                '📥 Export Excel'
              )}
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

        {/* Data Table Card */}
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
                {search ? 'Try a different search term' : 'Click "+ New Entry" above to add your first record'}
              </div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Actions</th>
                    {cols.map(c => <th key={c.key}>{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(row => (
                    <tr key={row.id}>
                      <td>
                        <div className="action-btn-group">
                          <button
                            className="btn-edit"
                            onClick={() => handleOpenEdit(row)}
                            title="Edit this record"
                          >
                            ✏️ Edit
                          </button>
                        </div>
                      </td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer count */}
        <div style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>
          Showing <strong style={{ color: 'var(--accent-dark)' }}>{filtered.length}</strong> of <strong style={{ color: 'var(--accent-dark)' }}>{total}</strong> Colorplast records
          {search && ` • Filtered by "${search}"`}
        </div>
      </div>

      {/* Entry / Edit Modal */}
      <EntryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        initialData={editRecord}
        role="colorplast"
        schema={schema}
        atrAts={atrAts}
      />

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
