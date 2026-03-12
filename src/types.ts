export interface InvoiceData {
  invoiceNumber: string;
  customerName: string;
  customerAddress: string;
  dateOfIssue: string;
  amount: string;
  descriptionHtml: string;
  itemName: string;
  ringSize: string;
  totalWeight: string;
  metal: string;
}

export interface InvoiceRecord {
  id: string;
  customerName: string;
  dateOfIssue: string;
  amount: string;
  status: 'draft' | 'complete';
  createdAt: string;
  updatedAt: string;
  data: InvoiceData;
}

export const defaultData: InvoiceData = {
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
