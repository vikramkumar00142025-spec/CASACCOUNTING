-- ==============================================================================
-- CLOUD ACCOUNTING SYSTEM - ENTERPRISE POSTGRESQL SCHEMA FOR SUPABASE
-- Complete Accounting, Billing, Delivery Challan, Inventory & RBAC System
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    state_code VARCHAR(10) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    pin_code VARCHAR(20) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    gstin VARCHAR(50) NOT NULL,
    pan VARCHAR(20) NOT NULL,
    cin VARCHAR(50),
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    ifsc VARCHAR(50) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    invoice_prefix VARCHAR(20) DEFAULT 'INV-',
    challan_prefix VARCHAR(20) DEFAULT 'DC-',
    purchase_prefix VARCHAR(20) DEFAULT 'PO-',
    currency VARCHAR(10) DEFAULT 'INR',
    allow_negative_inventory BOOLEAN DEFAULT FALSE,
    default_gst_rate NUMERIC(5,2) DEFAULT 18.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER PROFILES TABLE (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Viewer',
    permissions TEXT[] DEFAULT '{}',
    phone VARCHAR(30),
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WAREHOUSES TABLE
CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(30),
    is_default BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- 4. PRODUCTS & INVENTORY
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    brand VARCHAR(100),
    hsn_sac_code VARCHAR(50) NOT NULL,
    barcode VARCHAR(100),
    unit VARCHAR(30) NOT NULL DEFAULT 'PCS',
    purchase_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    mrp NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount_percent NUMERIC(5,2) DEFAULT 0.00,
    gst_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    opening_stock NUMERIC(12,2) DEFAULT 0.00,
    min_stock NUMERIC(12,2) DEFAULT 5.00,
    max_stock NUMERIC(12,2) DEFAULT 1000.00,
    current_stock NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
    rack VARCHAR(50),
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, sku)
);

-- 5. INVENTORY TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
    warehouse_name VARCHAR(255),
    transaction_type VARCHAR(50) NOT NULL,
    quantity NUMERIC(12,2) NOT NULL,
    previous_stock NUMERIC(12,2) NOT NULL,
    new_stock NUMERIC(12,2) NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    reference_id UUID,
    reference_number VARCHAR(100),
    notes TEXT,
    created_by_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pin_code VARCHAR(20) NOT NULL,
    gstin VARCHAR(50),
    pan VARCHAR(30),
    credit_limit NUMERIC(12,2) DEFAULT 50000.00,
    opening_balance NUMERIC(12,2) DEFAULT 0.00,
    current_balance NUMERIC(12,2) DEFAULT 0.00,
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    customer_type VARCHAR(50) DEFAULT 'Retail',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SUPPLIERS
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    gstin VARCHAR(50),
    pan VARCHAR(30),
    opening_balance NUMERIC(12,2) DEFAULT 0.00,
    current_balance NUMERIC(12,2) DEFAULT 0.00,
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    bank_details TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SALES INVOICES & ITEMS
CREATE TABLE IF NOT EXISTS public.sales_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    customer_name VARCHAR(255) NOT NULL,
    customer_gstin VARCHAR(50),
    customer_state VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(30),
    billing_address TEXT NOT NULL,
    shipping_address TEXT,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_discount NUMERIC(12,2) DEFAULT 0.00,
    taxable_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_cgst NUMERIC(12,2) DEFAULT 0.00,
    total_sgst NUMERIC(12,2) DEFAULT 0.00,
    total_igst NUMERIC(12,2) DEFAULT 0.00,
    round_off NUMERIC(6,2) DEFAULT 0.00,
    grand_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12,2) DEFAULT 0.00,
    balance_due NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(30) DEFAULT 'Confirmed',
    payment_method VARCHAR(50) DEFAULT 'Cash',
    notes TEXT,
    terms_and_conditions TEXT,
    challan_id UUID,
    warehouse_id UUID REFERENCES public.warehouses(id),
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS public.sales_invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.sales_invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    hsn_code VARCHAR(50),
    unit VARCHAR(30) DEFAULT 'PCS',
    quantity NUMERIC(12,2) NOT NULL,
    rate NUMERIC(12,2) NOT NULL,
    discount_percent NUMERIC(5,2) DEFAULT 0.00,
    discount_amount NUMERIC(12,2) DEFAULT 0.00,
    taxable_amount NUMERIC(12,2) NOT NULL,
    gst_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    cgst_amount NUMERIC(12,2) DEFAULT 0.00,
    sgst_amount NUMERIC(12,2) DEFAULT 0.00,
    igst_amount NUMERIC(12,2) DEFAULT 0.00,
    total NUMERIC(12,2) NOT NULL
);

-- 9. DELIVERY CHALLANS & ITEMS
CREATE TABLE IF NOT EXISTS public.delivery_challans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    challan_number VARCHAR(100) NOT NULL,
    challan_date DATE NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    customer_name VARCHAR(255) NOT NULL,
    delivery_address TEXT NOT NULL,
    reference_invoice_number VARCHAR(100),
    reference_invoice_id UUID,
    transporter VARCHAR(255),
    vehicle_number VARCHAR(50),
    eway_bill_number VARCHAR(100),
    status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Converted', 'Cancelled')),
    converted_invoice_id UUID,
    received_by VARCHAR(255),
    remarks TEXT,
    warehouse_id UUID REFERENCES public.warehouses(id),
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, challan_number)
);

CREATE TABLE IF NOT EXISTS public.delivery_challan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challan_id UUID NOT NULL REFERENCES public.delivery_challans(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    hsn_code VARCHAR(50),
    unit VARCHAR(30) DEFAULT 'PCS',
    quantity NUMERIC(12,2) NOT NULL,
    rate NUMERIC(12,2),
    notes TEXT
);

-- 10. PURCHASE INVOICES & ITEMS
CREATE TABLE IF NOT EXISTS public.purchase_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    purchase_number VARCHAR(100) NOT NULL,
    supplier_invoice_no VARCHAR(100),
    purchase_date DATE NOT NULL,
    due_date DATE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_gstin VARCHAR(50),
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_discount NUMERIC(12,2) DEFAULT 0.00,
    total_gst NUMERIC(12,2) DEFAULT 0.00,
    round_off NUMERIC(6,2) DEFAULT 0.00,
    grand_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12,2) DEFAULT 0.00,
    balance_due NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(30) DEFAULT 'Paid',
    payment_method VARCHAR(50) DEFAULT 'Bank Transfer',
    warehouse_id UUID REFERENCES public.warehouses(id),
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, purchase_number)
);

CREATE TABLE IF NOT EXISTS public.purchase_invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES public.purchase_invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    unit VARCHAR(30) DEFAULT 'PCS',
    quantity NUMERIC(12,2) NOT NULL,
    rate NUMERIC(12,2) NOT NULL,
    discount_percent NUMERIC(5,2) DEFAULT 0.00,
    taxable_amount NUMERIC(12,2) NOT NULL,
    gst_rate NUMERIC(5,2) NOT NULL,
    gst_amount NUMERIC(12,2) NOT NULL,
    total NUMERIC(12,2) NOT NULL
);

-- 11. PAYMENTS & RECEIPTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    payment_number VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    party_type VARCHAR(30) NOT NULL CHECK (party_type IN ('Customer', 'Supplier', 'Expense')),
    party_id UUID,
    party_name VARCHAR(255) NOT NULL,
    payment_type VARCHAR(30) NOT NULL CHECK (payment_type IN ('Receipt', 'Payment')),
    amount NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    invoice_id UUID,
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, payment_number)
);

-- 12. EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    expense_number VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    tax_amount NUMERIC(12,2) DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    vendor_name VARCHAR(255),
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, expense_number)
);

-- 13. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    record_id VARCHAR(100),
    details TEXT NOT NULL,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_challan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user company_id
CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Sample RLS policy pattern for company isolation:
-- Users can only select/insert/update/delete records where company_id = current_user_company_id()
CREATE POLICY "company_isolation_companies" ON public.companies
    FOR ALL USING (id = public.current_user_company_id());

CREATE POLICY "company_isolation_products" ON public.products
    FOR ALL USING (company_id = public.current_user_company_id());

CREATE POLICY "company_isolation_customers" ON public.customers
    FOR ALL USING (company_id = public.current_user_company_id());

CREATE POLICY "company_isolation_suppliers" ON public.suppliers
    FOR ALL USING (company_id = public.current_user_company_id());

CREATE POLICY "company_isolation_sales_invoices" ON public.sales_invoices
    FOR ALL USING (company_id = public.current_user_company_id());

CREATE POLICY "company_isolation_delivery_challans" ON public.delivery_challans
    FOR ALL USING (company_id = public.current_user_company_id());

CREATE POLICY "company_isolation_purchase_invoices" ON public.purchase_invoices
    FOR ALL USING (company_id = public.current_user_company_id());

CREATE POLICY "company_isolation_payments" ON public.payments
    FOR ALL USING (company_id = public.current_user_company_id());

CREATE POLICY "company_isolation_expenses" ON public.expenses
    FOR ALL USING (company_id = public.current_user_company_id());

CREATE POLICY "company_isolation_audit_logs" ON public.audit_logs
    FOR ALL USING (company_id = public.current_user_company_id());

CREATE POLICY "company_isolation_notifications" ON public.notifications
    FOR ALL USING (company_id = public.current_user_company_id());
