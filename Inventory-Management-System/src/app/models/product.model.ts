export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string | ArrayBuffer | null;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  description: string;
  attachments?: Attachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  date: Date;
  notes: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'bank';
  paymentStatus: 'paid' | 'pending' | 'partial';
  notes?: string;
  createdAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  supplierName: string;
  items: InvoiceItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  expectedDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}