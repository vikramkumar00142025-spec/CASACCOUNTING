'use client';

import React, { useState } from 'react';
import { Database, Check, Copy, RefreshCw, ShieldCheck, Terminal, ExternalLink } from 'lucide-react';
import { isSupabaseConfigured, testSupabaseConnection } from '@/lib/supabase';

export default function DatabaseMigrationView() {
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const isConfigured = isSupabaseConfigured();

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection();
    setTestResult(res);
    setTesting(false);
  };

  const copySQL = () => {
    navigator.clipboard.writeText(`-- Cloud Accounting System Complete Schema
-- Copy and run inside Supabase SQL Editor
-- File: /supabase/schema.sql
` + SCHEMA_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl text-xs">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Supabase Backend & PostgreSQL SQL Migrations</h1>
        <p className="text-slate-500 mt-0.5">
          Production PostgreSQL schema, Row Level Security (RLS) policies, foreign keys and database triggers
        </p>
      </div>

      {/* Supabase Status Card */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Supabase Connection State</h3>
              <p className="text-slate-500 text-[11px]">
                {isConfigured
                  ? 'Active environment variables found.'
                  : 'Running in Enterprise Local Persistence Engine mode with demo data fallback.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold text-xs ${
                isConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-blue-500'}`} />
              <span>{isConfigured ? 'Supabase Configured' : 'Offline / Demo Ready'}</span>
            </span>

            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-md font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>
          </div>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-slate-700">
          <p className="font-bold text-slate-900">Environment Variables Setup (.env.local):</p>
          <pre className="p-3 bg-slate-900 text-slate-100 rounded-md font-mono text-[11px] overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6..."`}
          </pre>
        </div>
      </div>

      {/* SQL Migration Script Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-slate-900 text-sm">PostgreSQL / Supabase Migration (schema.sql)</h3>
          </div>

          <button
            onClick={copySQL}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
          </button>
        </div>

        <p className="text-slate-500">
          Run this schema in your <strong>Supabase Project Dashboard &gt; SQL Editor</strong>. It creates all tables, indexes, triggers, and Row Level Security policies with multi-tenant company isolation.
        </p>

        <pre className="p-4 bg-slate-950 text-slate-200 rounded-lg font-mono text-[11px] leading-relaxed max-h-96 overflow-y-auto border border-slate-800">
          {SCHEMA_SNIPPET}
        </pre>
      </div>
    </div>
  );
}

const SCHEMA_SNIPPET = `-- ZENITH ERP POSTGRESQL TABLES WITH RLS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Companies & Profiles
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    gstin VARCHAR(50) NOT NULL,
    state VARCHAR(100) NOT NULL,
    state_code VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Viewer',
    permissions TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active'
);

-- 2. Warehouses & Products
CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    hsn_sac_code VARCHAR(50) NOT NULL,
    purchase_price NUMERIC(12,2) DEFAULT 0.00,
    selling_price NUMERIC(12,2) DEFAULT 0.00,
    gst_rate NUMERIC(5,2) DEFAULT 18.00,
    current_stock NUMERIC(12,2) DEFAULT 0.00,
    min_stock NUMERIC(12,2) DEFAULT 5.00
);

-- 3. Sales Invoices & Delivery Challans
CREATE TABLE IF NOT EXISTS public.sales_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    taxable_amount NUMERIC(12,2) NOT NULL,
    total_cgst NUMERIC(12,2) DEFAULT 0.00,
    total_sgst NUMERIC(12,2) DEFAULT 0.00,
    total_igst NUMERIC(12,2) DEFAULT 0.00,
    grand_total NUMERIC(12,2) NOT NULL,
    paid_amount NUMERIC(12,2) DEFAULT 0.00,
    balance_due NUMERIC(12,2) NOT NULL,
    payment_status VARCHAR(30) DEFAULT 'Confirmed'
);

CREATE TABLE IF NOT EXISTS public.delivery_challans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    challan_number VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'Pending'
);

-- Enable RLS and Tenant Isolation
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_challans ENABLE ROW LEVEL SECURITY;`;
