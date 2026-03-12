import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { InvoiceData, InvoiceRecord, defaultData } from './types';
import { getRecord, saveRecord, newId, nextInvoiceNumber } from './storage';

export default function Editor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<InvoiceData>({ ...defaultData });
  const [recordId] = useState(() => id ?? newId());
  const [createdAt] = useState(() => id ? (getRecord(id)?.createdAt ?? new Date().toISOString()) : new Date().toISOString());
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      const r = getRecord(id);
      if (r) setData(r.data);
    } else {
      setData(d => ({ ...d, invoiceNumber: nextInvoiceNumber() }));
    }
  }, [id]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = data.descriptionHtml || '';
    }
  }, []);

  const set = (field: keyof InvoiceData, value: string) =>
    setData(d => ({ ...d, [field]: value }));

  const execCmd = (cmd: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, undefined);
    setData(d => ({ ...d, descriptionHtml: editorRef.current?.innerHTML ?? '' }));
  };

  const handleSave = (andPreview = false) => {
    const record: InvoiceRecord = {
      id: recordId,
      customerName: data.customerName,
      dateOfIssue: data.dateOfIssue,
      amount: data.amount,
      status: 'draft',
      createdAt,
      updatedAt: new Date().toISOString(),
      data,
    };
    saveRecord(record);
    if (andPreview) navigate(`/preview/${recordId}`);
    else navigate('/');
  };

  return (
    <div className="form-shell">
      <header className="form-header">
        <div className="form-header-inner">
          <div className="form-brand">McCulloch — <span>Invoice Manager</span></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>Cancel</button>
            <button className="btn btn-ghost btn-sm" onClick={() => handleSave(false)}>Save Draft</button>
            <button className="btn btn-primary btn-sm" onClick={() => handleSave(true)}>Save & Preview</button>
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
