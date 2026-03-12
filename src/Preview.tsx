import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const [record, setRecord] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);
  const autoDownloadTriggered = useRef<boolean>(false);

  useEffect(() => {
    if (id) api.getInvoice(id).then(setRecord).catch(console.error);
  }, [id]);

  useEffect(() => {
    if (record && searchParams.get('download') === 'true' && !autoDownloadTriggered.current) {
      autoDownloadTriggered.current = true;
      handleDownloadPdf();
    }
  }, [record]);

  const handleDownloadPdf = async () => {
    if (!docRef.current || !record) return;
    setDownloading(true);
    try {
      const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const pages = docRef.current.querySelectorAll('.doc-page');

      // Hide letterhead images and add padding for clean PDF
      const lhImgs = docRef.current.querySelectorAll('.doc-lh-img');
      const lfImgs = docRef.current.querySelectorAll('.doc-lf-img');

      const origLhDisplay: string[] = [];
      const origLfDisplay: string[] = [];
      const origPagePaddingTop: string[] = [];
      const origPagePaddingBottom: string[] = [];

      lhImgs.forEach((el, i) => {
        origLhDisplay[i] = (el as HTMLElement).style.display;
        (el as HTMLElement).style.display = 'none';
      });
      lfImgs.forEach((el, i) => {
        origLfDisplay[i] = (el as HTMLElement).style.display;
        (el as HTMLElement).style.display = 'none';
      });
      pages.forEach((el, i) => {
        origPagePaddingTop[i] = (el as HTMLElement).style.paddingTop;
        origPagePaddingBottom[i] = (el as HTMLElement).style.paddingBottom;
        (el as HTMLElement).style.paddingTop = '20mm';
        (el as HTMLElement).style.paddingBottom = '20mm';
      });

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const filename = `Invoice-${record.invoice_number || id}.pdf`;

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i] as HTMLElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297);
      }

      pdf.save(filename);

      // Restore original styles
      lhImgs.forEach((el, i) => { (el as HTMLElement).style.display = origLhDisplay[i]; });
      lfImgs.forEach((el, i) => { (el as HTMLElement).style.display = origLfDisplay[i]; });
      pages.forEach((el, i) => {
        (el as HTMLElement).style.paddingTop = origPagePaddingTop[i];
        (el as HTMLElement).style.paddingBottom = origPagePaddingBottom[i];
      });
    } finally {
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
                    {record.item_image && (
                      <div className="inv-item-img-wrap">
                        <img src={record.item_image} alt="Item" className="inv-item-img" />
                      </div>
                    )}
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
