import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from './api';

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatAmount(raw: string) {
  const n = parseFloat((raw || '').replace(/[£,]/g, ''));
  if (isNaN(n)) return raw || '';
  return n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Preview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) api.getInvoice(id).then(setRecord).catch(console.error);
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!docRef.current || !record) return;
    setDownloading(true);

    const wrap = docRef.current.querySelector('.doc-pages-wrap') as HTMLElement | null;
    const shell = docRef.current.closest('.preview-shell') as HTMLElement | null;
    const prevWrapStyle = wrap ? wrap.getAttribute('style') || '' : '';
    const prevShellBg = shell ? shell.style.background : '';

    if (wrap) {
      wrap.style.background = '#fff';
      wrap.style.padding = '0';
      wrap.style.gap = '0';
    }
    if (shell) shell.style.background = '#fff';

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const filename = `Invoice-${record.invoice_number || id}.pdf`;
      await html2pdf()
        .set({
          margin: 0,
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(docRef.current)
        .save();
    } finally {
      if (wrap) wrap.setAttribute('style', prevWrapStyle);
      if (shell) shell.style.background = prevShellBg;
      setDownloading(false);
    }
  };

  if (!record) return <div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>;

  const addressLines = (record.customer_address || '').split('\n').filter(Boolean);

  return (
    <div className="preview-shell">
      <div className="preview-toolbar no-print">
        <div className="preview-title">Receipt #{record.invoice_number || '—'} — {record.customer_name || 'Draft'}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/edit/${id}`)}>Edit</button>
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>🖨️ Print</button>
          <button className="btn btn-primary btn-sm" onClick={handleDownloadPdf} disabled={downloading}>
            {downloading ? 'Generating…' : '⬇ Download PDF'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>Back</button>
        </div>
      </div>

      <div ref={docRef}>
        <div className="doc-pages-wrap">
          <div className="doc-page">
            <img src="/letterhead-header.png" alt="" className="doc-lh-img" />

            <div className="doc-content">
              <div className="inv-title">Receipt</div>
              <div className="inv-body">
                <div className="inv-left">
                  <div className="inv-desc-label">Description :</div>
                  <div className="inv-desc-html" dangerouslySetInnerHTML={{ __html: record.description_html || '' }} />
                  <div className="inv-items">
                    {record.item_name && <div className="inv-item-row"><em>Item: {record.item_name}</em></div>}
                    {record.ring_size && <div className="inv-item-row"><em>Ring Size: {record.ring_size}</em></div>}
                    {record.total_weight && <div className="inv-item-row"><em>Total Weight: {record.total_weight}</em></div>}
                    {record.metal && <div className="inv-item-row"><em>Metal: {record.metal}</em></div>}
                  </div>
                </div>
                <div className="inv-divider" />
                <div className="inv-right">
                  <div className="inv-amount-label">Amount (GBP)</div>
                  <div className="inv-amount">£{formatAmount(record.amount)}</div>
                  <div className="inv-right-section">
                    <div className="inv-right-label">Customer Name:</div>
                    <div className="inv-customer-name">{record.customer_name}</div>
                    {addressLines.map((line: string, i: number) => (
                      <div key={i} className="inv-customer-addr">{line}</div>
                    ))}
                  </div>
                  <div className="inv-right-section">
                    <div className="inv-right-label">Date of Issue:</div>
                    <div className="inv-date">{formatDate(record.date_of_issue)}</div>
                  </div>
                  <div className="inv-vat">VAT NO 275322603.</div>
                </div>
              </div>
            </div>

            <img src="/letterhead-footer.png" alt="" className="doc-lf-img" />
          </div>
        </div>
      </div>
    </div>
  );
}
