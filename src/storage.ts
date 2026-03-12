import { InvoiceData, InvoiceRecord } from './types';

const RECORDS_KEY = 'mcculloch-invoices';

export function getAllRecords(): InvoiceRecord[] {
  try { return JSON.parse(localStorage.getItem(RECORDS_KEY) ?? '[]'); }
  catch { return []; }
}

export function getRecord(id: string): InvoiceRecord | null {
  return getAllRecords().find(r => r.id === id) ?? null;
}

function isComplete(data: InvoiceData): boolean {
  return !!(data.customerName && data.dateOfIssue && data.amount && data.descriptionHtml);
}

export function saveRecord(record: InvoiceRecord): void {
  const all = getAllRecords();
  const idx = all.findIndex(r => r.id === record.id);
  record.status = isComplete(record.data) ? 'complete' : 'draft';
  if (idx >= 0) all[idx] = record;
  else all.unshift(record);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(all));
}

export function deleteRecord(id: string): void {
  const all = getAllRecords().filter(r => r.id !== id);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(all));
}

export function newId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36);
}

export function nextInvoiceNumber(): string {
  const all = getAllRecords();
  const nums = all.map(r => parseInt(r.data.invoiceNumber?.replace(/\D/g, '') || '0')).filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return String(max + 1).padStart(4, '0');
}
