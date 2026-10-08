'use client';

import React, { useState } from 'react';
import {
  Building,
  Save,
  CheckCircle2,
  ShieldCheck,
  Mail,
  Send,
  ExternalLink,
  Sparkles,
  KeyRound,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { CompanyProfile } from '@/types';

interface CompanySettingsViewProps {
  company: CompanyProfile;
  onUpdateCompany: (updated: Partial<CompanyProfile>) => void;
}

export default function CompanySettingsView({
  company,
  onUpdateCompany,
}: CompanySettingsViewProps) {
  const [formData, setFormData] = useState<CompanyProfile>(company);
  const [savedNotice, setSavedNotice] = useState(false);
  const [testEmail, setTestEmail] = useState('vikramkumar00142025@gmail.com');
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    result?: string;
    previewUrl?: string;
    error?: string;
  } | null>(null);

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) return;
    setTestStatus({ loading: true });
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail.trim(),
          name: 'Workspace Admin',
          code: Math.floor(100000 + Math.random() * 900000).toString(),
          companyName: formData.name,
          smtpConfig: formData.smtp_host
            ? {
                host: formData.smtp_host,
                port: formData.smtp_port || 587,
                user: formData.smtp_user,
                pass: formData.smtp_pass,
                from: formData.smtp_from,
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus({
          loading: false,
          result: data.message || `Test verification code dispatched to ${testEmail}!`,
          previewUrl: data.previewUrl,
        });
      } else {
        setTestStatus({ loading: false, error: data.error || 'Failed to dispatch test email.' });
      }
    } catch (err: any) {
      setTestStatus({ loading: false, error: err.message || 'Network error sending test email.' });
    }
  };

  const applySmtpPreset = (preset: 'gmail' | 'outlook' | 'brevo' | 'reset') => {
    if (preset === 'gmail') {
      setFormData((prev) => ({
        ...prev,
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_from: `"${prev.name}" <${prev.email || 'noreply@zenithapex.in'}>`,
      }));
    } else if (preset === 'outlook') {
      setFormData((prev) => ({
        ...prev,
        smtp_host: 'smtp.office365.com',
        smtp_port: 587,
        smtp_from: `"${prev.name}" <${prev.email || 'noreply@zenithapex.in'}>`,
      }));
    } else if (preset === 'brevo') {
      setFormData((prev) => ({
        ...prev,
        smtp_host: 'smtp-relay.brevo.com',
        smtp_port: 587,
        smtp_from: `"${prev.name}" <${prev.email || 'noreply@zenithapex.in'}>`,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        smtp_host: undefined,
        smtp_port: undefined,
        smtp_user: undefined,
        smtp_pass: undefined,
        smtp_from: undefined,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompany(formData);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Company Profile & GST Configuration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure legal business information, statutory tax identifiers, bank accounts and prefix sequencing
          </p>
        </div>

        {savedNotice && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Section 1: Business Identity */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b pb-2 border-slate-100">
            1. Commercial Identity & Registered Address
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Display Brand Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 font-medium"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Legal Corporate Entity Name *</label>
              <input
                type="text"
                value={formData.legal_name}
                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Registered Office Address *</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">City *</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">State *</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 font-medium"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">GST State Code *</label>
              <input
                type="text"
                value={formData.state_code}
                onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 font-mono"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">PIN Code *</label>
              <input
                type="text"
                value={formData.pin_code}
                onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Primary Phone *</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Billing Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Corporate Website</label>
              <input
                type="text"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Statutory Tax Identifiers */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b pb-2 border-slate-100">
            2. Statutory Tax & Regulatory Identifiers
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">GSTIN (15 Digits) *</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 font-mono uppercase font-bold"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Income Tax PAN *</label>
              <input
                type="text"
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 font-mono uppercase"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Corporate CIN (Optional)</label>
              <input
                type="text"
                value={formData.cin || ''}
                onChange={(e) => setFormData({ ...formData, cin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Banking Remittance Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b pb-2 border-slate-100">
            3. Remittance Bank Details (Printed on Invoices)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Bank Name *</label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Current Account Number *</label>
              <input
                type="text"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 font-mono font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">IFSC Code *</label>
              <input
                type="text"
                value={formData.ifsc}
                onChange={(e) => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 font-mono uppercase"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Bank Branch *</label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
                required
              />
            </div>
          </div>

          {/* UPI VPA & Merchant Settings for Dynamic QR */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <span>⚡ Dynamic UPI QR Settings</span>
              <span className="text-[10px] font-normal text-slate-500 normal-case">(Used for customer scan-to-pay QR generation)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">UPI ID / VPA *</label>
                <input
                  type="text"
                  placeholder="e.g. yourbusiness@hdfcbank"
                  value={formData.upi_id || ''}
                  onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">UPI Payee Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Zenith Apex Technologies"
                  value={formData.upi_payee_name || ''}
                  onChange={(e) => setFormData({ ...formData, upi_payee_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Merchant Category Code (MCC)</label>
                <input
                  type="text"
                  placeholder="e.g. 5411"
                  value={formData.merchant_code || ''}
                  onChange={(e) => setFormData({ ...formData, merchant_code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Document Prefixes & Accounting Controls */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b pb-2 border-slate-100">
            4. Document Numbering & Stock Invariant Controls
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Tax Invoice Prefix</label>
              <input
                type="text"
                value={formData.invoice_prefix}
                onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Delivery Challan Prefix</label>
              <input
                type="text"
                value={formData.challan_prefix}
                onChange={(e) => setFormData({ ...formData, challan_prefix: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Purchase PO Prefix</label>
              <input
                type="text"
                value={formData.purchase_prefix}
                onChange={(e) => setFormData({ ...formData, purchase_prefix: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900">Allow Negative Inventory Dispatch</p>
              <p className="text-slate-500 text-[11px]">
                When disabled, the ERP will strictly prevent generating invoices or stock issues if physical stock is insufficient.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allow_negative_inventory}
                onChange={(e) => setFormData({ ...formData, allow_negative_inventory: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
            </label>
          </div>
        </div>

        {/* Section 5: Email Verification & SMTP Mail Server Configuration */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2 border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>5. Email Verification & SMTP Mail Server Configuration</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Configure your mail server to deliver 6-digit OTP verification codes directly to employees&apos; email inboxes
              </p>
            </div>

            {/* Quick Provider Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Presets:</span>
              </span>
              <button
                type="button"
                onClick={() => applySmtpPreset('gmail')}
                className="px-2 py-0.5 text-[10px] font-semibold bg-red-50 text-red-700 hover:bg-red-100 rounded border border-red-200 transition-colors"
              >
                Gmail
              </button>
              <button
                type="button"
                onClick={() => applySmtpPreset('outlook')}
                className="px-2 py-0.5 text-[10px] font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 rounded border border-sky-200 transition-colors"
              >
                Outlook
              </button>
              <button
                type="button"
                onClick={() => applySmtpPreset('brevo')}
                className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
              >
                Brevo
              </button>
              <button
                type="button"
                onClick={() => applySmtpPreset('reset')}
                className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
              >
                Default / Test Mode
              </button>
            </div>
          </div>

          {/* Location explanation card */}
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-[11px] text-blue-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Where to find and set these variables?</span>
            </p>
            <p className="text-slate-600 leading-relaxed">
              <strong>Option 1 (In-App):</strong> Fill in the fields below and click <em>Save Company Settings</em>. The app uses these settings immediately!
            </p>
            <p className="text-slate-600 leading-relaxed">
              <strong>Option 2 (Environment file):</strong> In your project root, open <code className="bg-blue-100/80 px-1 py-0.5 rounded text-blue-950 font-mono text-[10px]">.env.example</code> or your deployment environment settings (<code className="bg-blue-100/80 px-1 py-0.5 rounded text-blue-950 font-mono text-[10px]">SMTP_HOST</code>, <code className="bg-blue-100/80 px-1 py-0.5 rounded text-blue-950 font-mono text-[10px]">SMTP_PORT</code>, <code className="bg-blue-100/80 px-1 py-0.5 rounded text-blue-950 font-mono text-[10px]">SMTP_USER</code>, <code className="bg-blue-100/80 px-1 py-0.5 rounded text-blue-950 font-mono text-[10px]">SMTP_PASS</code>).
            </p>
            <p className="text-slate-600 leading-relaxed">
              <strong>Zero-Setup Mode:</strong> If you leave these blank, the app runs in <em>Test Mode (Ethereal)</em>: it generates real live test mailboxes with an instant browser view link plus on-screen OTP cards with 1-click Quick Fill.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">SMTP Host (Mail Server)</label>
              <input
                type="text"
                placeholder="e.g. smtp.gmail.com or smtp.office365.com"
                value={formData.smtp_host || ''}
                onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">SMTP Port</label>
              <input
                type="number"
                placeholder="587 (TLS) or 465 (SSL)"
                value={formData.smtp_port || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    smtp_port: e.target.value ? parseInt(e.target.value, 10) : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">From Address (Sender)</label>
              <input
                type="text"
                placeholder='e.g. "Zenith Apex ERP" <noreply@zenithapex.in>'
                value={formData.smtp_from || ''}
                onChange={(e) => setFormData({ ...formData, smtp_from: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">SMTP Username / Email ID</label>
              <input
                type="text"
                placeholder="e.g. vikramkumar00142025@gmail.com"
                value={formData.smtp_user || ''}
                onChange={(e) => setFormData({ ...formData, smtp_user: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">SMTP Password / App Password</label>
              <input
                type="password"
                placeholder="Enter 16-character Google App Password or SMTP key"
                value={formData.smtp_pass || ''}
                onChange={(e) => setFormData({ ...formData, smtp_pass: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 font-mono text-xs"
              />
              <span className="text-[10px] text-slate-400 block">
                For Gmail: Use an <em>App Password</em> from your Google Account Security settings.
              </span>
            </div>
          </div>

          {/* Test verification mail dispatcher */}
          <div className="pt-3 border-t border-slate-100 bg-slate-50 p-3.5 rounded-lg space-y-2">
            <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-blue-600" />
              <span>Send Live Test Verification Code:</span>
            </span>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="email"
                placeholder="Enter target email e.g. vikramkumar00142025@gmail.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full sm:w-80 px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-xs"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={testStatus?.loading || !testEmail.trim()}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {testStatus?.loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test Code</span>
                  </>
                )}
              </button>
            </div>

            {testStatus && (
              <div
                className={`p-2.5 rounded-md text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2 ${
                  testStatus.error
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {testStatus.error ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="font-medium">{testStatus.error || testStatus.result}</span>
                </div>

                {testStatus.previewUrl && (
                  <a
                    href={testStatus.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold underline text-blue-700 hover:text-blue-900 shrink-0"
                  >
                    <span>View Delivered Email Online</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Company Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
