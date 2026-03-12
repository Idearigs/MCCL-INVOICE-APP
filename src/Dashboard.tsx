import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearToken } from './api';

function formatDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.getInvoices();
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteInvoice(id);
      setDeleteConfirm(null);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    clearToken();
    window.location.href = '/login';
  };

  const filtered = records.filter(r => {
    const matchesSearch =
      (r.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.date_of_issue || '').includes(search) ||
      (r.invoice_number || '').includes(search);
    const dateField = (r.date_of_issue || '').split('T')[0];
    const matchesFrom = !dateFrom || dateField >= dateFrom;
    const matchesTo = !dateTo || dateField <= dateTo;
    return matchesSearch && matchesFrom && matchesTo;
  });

  const thisMonth = records.filter(r => {
    const d = new Date(r.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const totalRevenue = records.reduce((sum, r) => {
    const n = parseFloat((r.amount || '').replace(/[£,]/g, ''));
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  return (
    <div className="dash-shell">
      <header className="dash-header">
        <div className="dash-header-inner">
          <div className="dash-brand">
            <div className="dash-brand-text">McCulloch - Invoice Manager</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => navigate('/new')}>+ New Invoice</button>
            <button className="btn btn-ghost" onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      </header>

      <main className="dash-main">
        <div className="dash-stats">
          <div className="dash-stat-card">
            <div className="dash-stat-label">Total Invoices</div>
            <div className="dash-stat-value">{records.length}</div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-label">This Month</div>
            <div className="dash-stat-value">{thisMonth}</div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-label">Complete</div>
            <div className="dash-stat-value">{records.filter(r => r.status === 'complete').length}</div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-label">Total Revenue</div>
            <div className="dash-stat-value">
              {totalRevenue > 0 ? `£${totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}` : '—'}
            </div>
          </div>
        </div>

        <div className="dash-table-card">
          <div className="dash-table-toolbar">
            <input
              type="text"
              placeholder="Search by customer, date or invoice number…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="dash-search"
            />
            <span className="dash-count">{filtered.length} {filtered.length === 1 ? 'invoice' : 'invoices'}</span>
          </div>
          <div className="dash-date-filters">
            <span className="dash-date-label">Date:</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="dash-date-input" title="From date" />
            <span className="dash-date-label">—</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="dash-date-input" title="To date" />
            {(dateFrom || dateTo) && (
              <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => { setDateFrom(''); setDateTo(''); }}>✕</button>
            )}
          </div>

          {loading ? (
            <div className="dash-empty"><div style={{ color: 'var(--grey)' }}>Loading…</div></div>
          ) : filtered.length === 0 ? (
            <div className="dash-empty">
              {records.length === 0 ? (
                <>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🧾</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No invoices yet</div>
                  <div style={{ color: 'var(--grey)', marginBottom: 20 }}>Create your first invoice</div>
                  <button className="btn btn-primary" onClick={() => navigate('/new')}>+ New Invoice</button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
                  <div>No results for "{search}"</div>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="dash-table-wrap dash-desktop-only">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Customer</th>
                      <th>Item</th>
                      <th>Amount (GBP)</th>
                      <th>Date of Issue</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr key={r.id} className="dash-row">
                        <td className="dash-cell-meta">{r.invoice_number ? `#${r.invoice_number}` : '—'}</td>
                        <td className="dash-cell-name">{r.customer_name || '—'}</td>
                        <td>{r.item_name || '—'}</td>
                        <td className="dash-cell-value">
                          {r.amount ? `£${parseFloat(r.amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td>{formatDate(r.date_of_issue)}</td>
                        <td><span className={`dash-badge ${r.status}`}>{r.status === 'complete' ? 'Complete' : 'Draft'}</span></td>
                        <td>
                          <div className="dash-actions">
                            <button className="dash-action-btn" onClick={() => navigate(`/edit/${r.id}`)} title="Edit">✏️</button>
                            <button className="dash-action-btn" onClick={() => navigate(`/preview/${r.id}`)} title="Preview & Print">🖨️</button>
                            <button className="dash-action-btn download" onClick={() => navigate(`/preview/${r.id}?download=true`)} title="Download PDF">⬇</button>
                            <button className="dash-action-btn danger" onClick={() => setDeleteConfirm(r.id)} title="Delete">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="dash-cards dash-mobile-only">
                {filtered.map(r => (
                  <div key={r.id} className="dash-card">
                    <div className="dash-card-body">
                      <div className="dash-card-row1">
                        <div className="dash-card-left">
                          <div className="dash-card-name">{r.customer_name || '—'}</div>
                          <div className="dash-card-sub">
                            {r.invoice_number ? `#${r.invoice_number}` : ''}
                            {r.invoice_number && r.date_of_issue ? ' · ' : ''}
                            {formatDate(r.date_of_issue)}
                            {r.item_name ? ` · ${r.item_name}` : ''}
                          </div>
                        </div>
                        <div className="dash-card-right">
                          {r.amount && <div className="dash-card-amount">£{parseFloat(r.amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</div>}
                          <span className={`dash-badge ${r.status}`}>{r.status === 'complete' ? 'Complete' : 'Draft'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="dash-card-actions">
                      <button className="dash-act-btn" onClick={() => navigate(`/edit/${r.id}`)}>Edit</button>
                      <button className="dash-act-btn" onClick={() => navigate(`/preview/${r.id}`)}>Preview</button>
                      <button className="dash-act-btn primary" onClick={() => navigate(`/preview/${r.id}?download=true`)}>PDF</button>
                      <button className="dash-act-btn danger" onClick={() => setDeleteConfirm(r.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Delete Invoice?</h3>
            <p style={{ color: 'var(--grey)', marginBottom: 24, fontSize: 14 }}>This cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
