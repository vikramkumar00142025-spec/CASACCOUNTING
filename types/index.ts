export type UserRole =
  | 'Super Admin'
  | 'Admin'
  | 'Manager'
  | 'Accountant'
  | 'Sales Staff'
  | 'Purchase Staff'
  | 'Inventory Staff'
  | 'Viewer';

export type Permission =
  | 'view_dashboard'
  | 'view_sales'
  | 'create_sales'
  | 'edit_sales'
  | 'delete_sales'
  | 'manage_challans'
  | 'view_purchases'
  | 'create_purchases'
  | 'edit_purchases'
  | 'delete_purchases'
  | 'view_products'
  | 'create_products'
  | 'edit_products'
  | 'delete_products'
  | 'manage_inventory'
  | 'view_customers'
  | 'create_customers'
  | 'edit_customers'
  | 'delete_customers'
  | 'view_suppliers'
  | 'create_suppliers'
  | 'edit_suppliers'
  | 'delete_suppliers'
  | 'manage_payments'
  | 'manage_expenses'
  | 'view_accounting'
  | 'view_reports'
  | 'manage_users'
  | 'manage_settings'
  | 'view_audit_logs'
  | 'manage_database';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  permissions: Permission[];
  status: 'active' | 'inactive';
  company_id: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  last_login_at?: string;
  email_verified: boolean;
  verification_code?: string;
  verification_sent_at?: string;
  password?: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  legal_name: string;
  logo_url?: string;
  address: string;
  city: string;
  state: string;
  state_code: string;
  country: string;
  pin_code: string;
  phone: string;
  email: string;
  website?: string;
  gstin: string;
  pan: string;
  cin?: string;
  bank_name: string;
  account_number: string;
  ifsc: string;
  branch: string;
  upi_id?: string;
  upi_payee_name?: string;
  merchant_code?: string;
  invoice_prefix: string;
  challan_prefix: string;
  purchase_prefix: string;
  currency: string;
  allow_negative_inventory: boolean;
  default_gst_rate: number;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_pass?: string;
  smtp_from?: string;
}

export interface Warehouse {
  id: string;
  company_id: string;
  name: string;
  code: string;
  address: string;
  contact_person: string;
  phone: string;
  is_default: boolean;
  status: 'active' | 'inactive';
}

export interface Product {
  id: string;
  company_id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  hsn_sac_code: string;
  barcode?: string;
  unit: string;
  purchase_price: number;
  selling_price: number;
  mrp: number;
  discount_percent: number;
  gst_rate: number;
  opening_stock: number;
  min_stock: number;
  max_stock: number;
  current_stock: number;
  warehouse_id: string;
  rack?: string;
  image_url?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export type InventoryTransactionType =
  | 'Opening'
  | 'Purchase'
  | 'Sales'
  | 'Sales Return'
  | 'Purchase Return'
  | 'Stock Adjustment'
  | 'Stock Transfer'
  | 'Damaged Stock';

export interface InventoryTransaction {
  id: string;
  company_id: string;
  product_id: string;
  product_name: string;
  warehouse_id: string;
  warehouse_name: string;
  transaction_type: InventoryTransactionType;
  quantity: number; // positive or negative
  previous_stock: number;
  new_stock: number;
  reference_type: string;
  reference_id?: string;
  reference_number?: string;
  notes?: string;
  created_by_name: string;
  created_at: string;
}

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  company_name?: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;
  gstin?: string;
  pan?: string;
  credit_limit: number;
  opening_balance: number;
  current_balance: number;
  payment_terms: string;
  customer_type: 'Wholesale' | 'Retail' | 'Corporate' | 'Distributor';
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Supplier {
  id: string;
  company_id: string;
  name: string;
  company_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  gstin?: string;
  pan?: string;
  opening_balance: number;
  current_balance: number;
  payment_terms: string;
  bank_details?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface SalesInvoiceItem {
  id: string;
  product_id: string;
  product_name: string;
  hsn_code: string;
  unit: string;
  quantity: number;
  rate: number;
  discount_percent: number;
  discount_amount: number;
  taxable_amount: number;
  gst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total: number;
}

export type InvoicePaymentStatus =
  | 'Draft'
  | 'Confirmed'
  | 'Partially Paid'
  | 'Paid'
  | 'Cancelled';

export interface SalesInvoice {
  id: string;
  company_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  customer_id: string;
  customer_name: string;
  customer_gstin?: string;
  customer_state: string;
  customer_phone: string;
  billing_address: string;
  shipping_address: string;
  items: SalesInvoiceItem[];
  subtotal: number;
  total_discount: number;
  taxable_amount: number;
  total_cgst: number;
  total_sgst: number;
  total_igst: number;
  round_off: number;
  grand_total: number;
  paid_amount: number;
  balance_due: number;
  payment_status: InvoicePaymentStatus;
  payment_method: string;
  notes?: string;
  terms_and_conditions?: string;
  challan_id?: string;
  warehouse_id: string;
  created_by: string;
  created_at: string;
}

export interface DeliveryChallanItem {
  id: string;
  product_id: string;
  product_name: string;
  hsn_code: string;
  unit: string;
  quantity: number;
  rate?: number;
  notes?: string;
}

export interface DeliveryChallan {
  id: string;
  company_id: string;
  challan_number: string;
  challan_date: string;
  customer_id: string;
  customer_name: string;
  delivery_address: string;
  reference_invoice_number?: string;
  reference_invoice_id?: string;
  transporter?: string;
  vehicle_number?: string;
  eway_bill_number?: string;
  items: DeliveryChallanItem[];
  status: 'Pending' | 'Converted' | 'Cancelled';
  converted_invoice_id?: string;
  received_by?: string;
  remarks?: string;
  warehouse_id: string;
  created_by: string;
  created_at: string;
}

export interface PurchaseInvoiceItem {
  id: string;
  product_id: string;
  product_name: string;
  unit: string;
  quantity: number;
  rate: number;
  discount_percent: number;
  taxable_amount: number;
  gst_rate: number;
  gst_amount: number;
  total: number;
}

export interface PurchaseInvoice {
  id: string;
  company_id: string;
  purchase_number: string;
  supplier_invoice_no?: string;
  purchase_date: string;
  due_date: string;
  supplier_id: string;
  supplier_name: string;
  supplier_gstin?: string;
  items: PurchaseInvoiceItem[];
  subtotal: number;
  total_discount: number;
  total_gst: number;
  round_off: number;
  grand_total: number;
  paid_amount: number;
  balance_due: number;
  payment_status: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Cancelled';
  payment_method: string;
  warehouse_id: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface SalesReturn {
  id: string;
  company_id: string;
  return_number: string;
  return_date: string;
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  credit_note_number: string;
  items: {
    product_id: string;
    product_name: string;
    return_qty: number;
    rate: number;
    gst_rate: number;
    total: number;
  }[];
  total_amount: number;
  reason: string;
  warehouse_id: string;
  created_by: string;
  created_at: string;
}

export interface PurchaseReturn {
  id: string;
  company_id: string;
  return_number: string;
  return_date: string;
  purchase_id: string;
  purchase_number: string;
  supplier_id: string;
  supplier_name: string;
  debit_note_number: string;
  items: {
    product_id: string;
    product_name: string;
    return_qty: number;
    rate: number;
    gst_rate: number;
    total: number;
  }[];
  total_amount: number;
  reason: string;
  warehouse_id: string;
  created_by: string;
  created_at: string;
}

export interface Payment {
  id: string;
  company_id: string;
  payment_number: string;
  date: string;
  party_type: 'Customer' | 'Supplier' | 'Expense';
  party_id: string;
  party_name: string;
  payment_type: 'Receipt' | 'Payment';
  amount: number;
  payment_method: 'Cash' | 'Bank Transfer' | 'UPI' | 'Card' | 'Cheque' | 'Other';
  reference_number?: string;
  invoice_id?: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export type ExpenseCategory =
  | 'Rent'
  | 'Salary'
  | 'Electricity'
  | 'Transport'
  | 'Internet'
  | 'Office Expense'
  | 'Marketing'
  | 'Maintenance'
  | 'Other';

export interface Expense {
  id: string;
  company_id: string;
  expense_number: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  payment_method: string;
  vendor_name?: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  company_id: string;
  ledger_type: 'Customer' | 'Supplier' | 'Cash' | 'Bank' | 'Sales' | 'Purchase' | 'Expense';
  party_id?: string;
  party_name?: string;
  date: string;
  reference_type: string;
  reference_number: string;
  narration: string;
  debit: number;
  credit: number;
  balance: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  company_id: string;
  user_name: string;
  user_email: string;
  action: 'Create' | 'Update' | 'Delete' | 'Login' | 'Logout' | 'Cancel' | 'Stock Adjustment' | 'Stock Transfer' | 'Permission Change';
  module: 'Sales' | 'Purchases' | 'Challans' | 'Inventory' | 'Customers' | 'Suppliers' | 'Payments' | 'Expenses' | 'Settings' | 'Users' | 'Auth';
  record_id?: string;
  details: string;
  ip_address?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  company_id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'danger';
  read: boolean;
  link?: string;
  created_at: string;
}
