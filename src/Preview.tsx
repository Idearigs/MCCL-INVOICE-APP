import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { InvoiceRecord } from './types';
import { getRecord } from './storage';

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function formatAmount(raw: string) {
  const n = parseFloat(raw?.replace(/[£,]/g, '') || '');
  if (isNaN(n)) return raw || '';
  return n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Preview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<InvoiceRecord | null>(null);

  useEffect(() => {
    if (id) setRecord(getRecord(id));
  }, [id]);

  if (!record) return <div style={{ padding: 40 }}>Invoice not found.</div>;

  const d = record.data;
  const addressLines = (d.customerAddress || '').split('\n').filter(Boolean);

  return (
    <div className="preview-shell">
      <div className="preview-toolbar no-print">
        <div className="preview-title">Receipt #{d.invoiceNumber || '—'} — {record.customerName || 'Draft'}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/edit/${id}`)}>Edit</button>
          <button className="btn btn-primary btn-sm" onClick={() => window.print()}>Print / Save PDF</button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>Back</button>
        </div>
      </div>

      <div className="doc-pages-wrap">
        <div className="doc-page">
          {/* Letterhead header */}
          <img src="/letterhead-header.png" alt="" className="doc-lh-img" />

          <div className="doc-content">
            {/* Receipt title */}
            <div className="inv-title">Receipt</div>

            {/* Two-column body */}
            <div className="inv-body">
              {/* Left column */}
              <div className="inv-left">
                <div className="inv-desc-label">Description :</div>
                <div
                  className="inv-desc-html"
                  dangerouslySetInnerHTML={{ __html: d.descriptionHtml || '' }}
                />
                <div className="inv-items">
                  {d.itemName && <div className="inv-item-row"><em>Item: {d.itemName}</em></div>}
                  {d.ringSize && <div className="inv-item-row"><em>Ring Size: {d.ringSize}</em></div>}
                  {d.totalWeight && <div className="inv-item-row"><em>Total Weight: {d.totalWeight}</em></div>}
                  {d.metal && <div className="inv-item-row"><em>Metal: {d.metal}</em></div>}
                </div>
              </div>

              {/* Vertical divider */}
              <div className="inv-divider" />

              {/* Right column */}
              <div className="inv-right">
                <div className="inv-amount-label">Amount (GBP)</div>
                <div className="inv-amount">£{formatAmount(d.amount)}</div>

                <div className="inv-right-section">
                  <div className="inv-right-label">Customer Name:</div>
                  <div className="inv-customer-name">{d.customerName}</div>
                  {addressLines.map((line, i) => (
                    <div key={i} className="inv-customer-addr">{line}</div>
                  ))}
                </div>

                <div className="inv-right-section">
                  <div className="inv-right-label">Date of Issue:</div>
                  <div className="inv-date">{formatDate(d.dateOfIssue)}</div>
                </div>

                <div className="inv-vat">VAT NO 275322603.</div>
              </div>
            </div>
          </div>

          {/* Letterhead footer */}
          <img src="/letterhead-footer.png" alt="" className="doc-lf-img" />
        </div>
      </div>
    </div>
  );
}
