# Cloud Accounting System

Enterprise-grade Cloud Accounting, GST Invoicing, Delivery Challans, Multi-Warehouse Inventory, and Double-Entry Bookkeeping platform.

## Overview
Cloud Accounting System is a modern, responsive web application engineered for small-to-medium businesses and enterprises. It provides comprehensive financial workflows compliant with GST regulations, automated debit/credit ledger posting, multi-warehouse stock management, delivery challan dispatch, and real-time analytics.

## Core Features

- **GST Billing & Invoicing**: Comprehensive tax calculation (CGST, SGST, IGST, UTGST, and Cess), multi-item invoices, payment receipts, printable tax invoice formats, and dynamic UPI QR code generator.
- **Delivery Challan Management**: Dispatch delivery challans with conversion to tax invoices, warehouse tracking, and PDF/print templates.
- **Multi-Warehouse Inventory**: Stock catalog, multi-depot inventory tracking, stock adjustments, batch/serial tracking, and stock movement logs.
- **Purchases & Inward Supplies**: Purchase orders, inward bills, and debit note management.
- **Double-Entry Accounting Ledgers**: General ledger, chart of accounts, automated journal entries for invoices, purchases, payments, and expenses.
- **Parties & Contacts**: Customer and supplier directory with receivables/payables balance tracking.
- **Role-Based Access Control (RBAC)**: Role permissions for Super Admin, Admin, Accountant, Sales Staff, and Warehouse Staff.
- **Supabase & Local Engine**: Cloud PostgreSQL backend support with Row Level Security (RLS) policies and enterprise local fallback storage.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Motion
- **Database**: PostgreSQL / Supabase ready (`supabase/schema.sql`)

## Getting Started

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build
```bash
npm run build
```
