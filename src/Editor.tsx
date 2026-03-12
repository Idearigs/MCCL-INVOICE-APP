import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from './api';

const emptyData = {
  invoiceNumber: '',
  customerName: '',
  customerAddress: '',
  dateOfIssue: new Date().toISOString().split('T')[0],
  amount: '',
  descriptionHtml: '',
  itemName: '',
  ringSize: '',
  totalWeight: '',
  metal: '',
};

export default function Editor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState({ ...emptyData });
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      api.getInvoice(id).then(r => {
        setData({
          invoiceNumber: r.invoice_number || '',
          customerName: r.customer_name || '',
          customerAddress: r.customer_address || '',
          dateOfIssue: r.date_of_issue ? r.date_of_issue.split('T')[0] : emptyData.dateOfIssue,
          amount: r.amount || '',
          descriptionHtml: r.description_html || '',
          itemName: r.item_name || '',
          ringSize: r.ring_size || '',
          totalWeight: r.total_weight || '',
          metal: r.metal || '',
        });
        if (editorRef.current) editorRef.current.innerHTML = r.description_html || '';
      }).catch(console.error);
    } else {
      api.nextNumber().then(({ next }) => setData(d => ({ ...d, invoiceNumber: next }))).catch(() => {});
      if (editorRef.current) editorRef.current.innerHTML = '';
    }
  }, [id]);

  const set = (field: string, value: string) => setData(d => ({ ...d, [field]: value }));

  const execCmd = (cmd: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, undefined);
    setData(d => ({ ...d, descriptionHtml: editorRef.current?.innerHTML ?? '' }));
  };

  const payload = (status: 'draft' | 'complete') => ({
    invoice_number: data.invoiceNumber,
    customer_name: data.customerName,
    customer_address: data.customerAddress,
    date_of_issue: data.dateOfIssue || null,
    amount: data.amount,
    description_html: data.descriptionHtml,
    item_name: data.itemName,
    ring_size: data.ringSize,
    total_weight: data.totalWeight,
    metal: data.metal,
    status,
  });

  const handleSave = async (andPreview = false) => {
    setSaving(true);
    try {
      const status = andPreview ? 'complete' : 'draft';
      let saved;
      if (id) {
        saved = await api.updateInvoice(id, payload(status));
      } else {
        saved = await api.createInvoice(payload(status));
      }
      if (andPreview) navigate(`/preview/${saved.id}`);
      else navigate('/');
    } catch (err: any) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="form-shell">
      <header className="form-header">
        <div className="form-header-inner">
          <div className="form-brand">McCulloch — <span>Invoice Manager</span></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>Cancel</button>
            <button className="btn btn-ghost btn-sm" onClick={() => handleSave(false)} disabled={saving}>Save Draft</button>
            <button className="btn btn-primary btn-sm" onClick={() => handleSave(true)} disabled={saving}>
              {saving ? 'Saving…' : 'Save & Preview'}
            </button>
          </div>
        </div>
      </header>

      <main className="form-main">
        <div className="section-card">
          <div className="section-header">
            <div className="section-number">1</div>
            <div className="section-title">Invoice Details</div>
          </div>
          <div className="section-body">
            <div className="form-grid-2">
              <div className="form-row">
                <label className="form-label">Invoice Number</label>
                <input type="text" value={data.invoiceNumber} onChange={e => set('invoiceNumber', e.target.value)} placeholder="0001" />
              </div>
              <div className="form-row">
                <label className="form-label">Date of Issue</label>
                <input type="date" value={data.dateOfIssue} onChange={e => set('dateOfIssue', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <label className="form-label">Amount (GBP) <span className="form-hint">numbers only, e.g. 2500.00</span></label>
              <input type="text" value={data.amount} onChange={e => set('amount', e.target.value)} placeholder="2500.00" />
            </div>
          </div>
        </div>

        <div className="section-card">
          <div className="section-header">
            <div className="section-number">2</div>
            <div className="section-title">Customer</div>
          </div>
          <div className="section-body">
            <div className="form-row">
              <label className="form-label">Customer Name</label>
              <input type="text" value={data.customerName} onChange={e => set('customerName', e.target.value)} placeholder="LDN Professional" />
            </div>
            <div className="form-row">
              <label className="form-label">Customer Address</label>
              <textarea value={data.customerAddress} onChange={e => set('customerAddress', e.target.value)} placeholder="105, 3&#10;Limeharbour&#10;London" rows={3} />
            </div>
          </div>
        </div>

        <div className="section-card">
          <div className="section-header">
            <div className="section-number">3</div>
            <div className="section-title">Description</div>
          </div>
          <div className="section-body">
            <div className="form-row">
              <label className="form-label">Description <span className="form-hint">appears on left side of invoice</span></label>
              <div className="editor-wrap">
                <div className="editor-toolbar">
                  <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('bold'); }}>B</button>
                  <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('italic'); }}>I</button>
                  <div className="toolbar-sep" />
                  <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('insertUnorderedList'); }}>List</button>
                  <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('removeFormat'); }}>Clear</button>
                </div>
                <div
                  ref={editorRef}
                  className="editor-content"
                  contentEditable
                  suppressContentEditableWarning
                  data-placeholder="Enter description..."
                  onInput={() => setData(d => ({ ...d, descriptionHtml: editorRef.current?.innerHTML ?? '' }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="section-card">
          <div className="section-header">
            <div className="section-number">4</div>
            <div className="section-title">Item Details</div>
          </div>
          <div className="section-body">
            <div className="form-row">
              <label className="form-label">Item</label>
              <input type="text" value={data.itemName} onChange={e => set('itemName', e.target.value)} placeholder="Green Sapphire & Diamond Three-Stone Ring" />
            </div>
            <div className="form-grid-2">
              <div className="form-row">
                <label className="form-label">Ring Size <span className="form-hint">optional</span></label>
                <input type="text" value={data.ringSize} onChange={e => set('ringSize', e.target.value)} placeholder="N" />
              </div>
              <div className="form-row">
                <label className="form-label">Total Weight <span className="form-hint">optional</span></label>
                <input type="text" value={data.totalWeight} onChange={e => set('totalWeight', e.target.value)} placeholder="3.0 grams" />
              </div>
            </div>
            <div className="form-row">
              <label className="form-label">Metal <span className="form-hint">optional</span></label>
              <input type="text" value={data.metal} onChange={e => set('metal', e.target.value)} placeholder="18 Carat Yellow Gold (Hallmarked)" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
