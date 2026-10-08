'use client';

import React, { useState, useMemo } from 'react';
import { CreditCard, Plus, Search, ArrowDownLeft, ArrowUpRight, QrCode, Sparkles, Smartphone, CheckCircle } from 'lucide-react';
import { Payment, Customer, Supplier, SalesInvoice, CompanyProfile } from '@/types';
import { formatINR } from '@/lib/gst-calculator';
import { getTodayDateString, generateDocNumber } from '@/lib/utils';
import DynamicUPIPaymentModal from './DynamicUPIPaymentModal';

interface PaymentListViewProps {
  payments: Payment[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: SalesInvoice[];
  company: CompanyProfile;
  onCreatePayment: (data: Omit<Payment, 'id' | 'company_id' | 'created_by' | 'created_at'>) => { success: boolean };
}

export default function PaymentListView({
  payments,
  customers,
  suppliers,
  invoices,
  company,
  onCreatePayment,
}: PaymentListViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [selectedInvoiceForUPI, setSelectedInvoiceForUPI] = useState<SalesInvoice | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Receipt' | 'Payment' | 'PendingUPI'>('ALL');

  // Form states
  const [partyType, setPartyType] = useState<'Customer' | 'Supplier'>('Customer');
  const [paymentType, setPaymentType] = useState<'Receipt' | 'Payment'>('Receipt');
  const [partyId, setPartyId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'UPI' | 'Card' | 'Cheque'>('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [notes, setNotes] = useState('');

  // Pending collection invoices
  const pendingInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.payment_status !== 'Cancelled' && inv.balance_due > 0);
  }, [invoices]);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch =
        p.party_name.toLowerCase().includes(search.toLowerCase()) ||
        p.payment_number.toLowerCase().includes(search.toLowerCase()) ||
        (p.reference_number && p.reference_number.toLowerCase().includes(search.toLowerCase()));

      const matchType =
        typeFilter === 'ALL' ||
        typeFilter === 'PendingUPI' ||
        p.payment_type === typeFilter;
      return matchSearch && matchType;
    });
  }, [payments, search, typeFilter]);

  const totalReceipts = payments.filter((p) => p.payment_type === 'Receipt').reduce((s, p) => s + p.amount, 0);
  const totalOutflows = payments.filter((p) => p.payment_type === 'Payment').reduce((s, p) => s + p.amount, 0);
  const totalPendingReceivables = pendingInvoices.reduce((s, inv) => s + inv.balance_due, 0);

  const handleOpenModal = (presetType: 'Receipt' | 'Payment') => {
    setPaymentType(presetType);
    if (presetType === 'Receipt') {
      setPartyType('Customer');
      setPartyId(customers[0]?.id || '');
    } else {
      setPartyType('Supplier');
      setPartyId(suppliers[0]?.id || '');
    }
    setShowModal(true);
  };

  const handleOpenDynamicUPI = (inv?: SalesInvoice) => {
    setSelectedInvoiceForUPI(inv || pendingInvoices[0] || invoices[0] || null);
    setShowUPIModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    let partyName = '';
    if (partyType === 'Customer') {
      const c = customers.find((cust) => cust.id === partyId);
      partyName = c ? c.name : 'Customer';
    } else {
      const s = suppliers.find((supp) => supp.id === partyId);
      partyName = s ? s.company_name : 'Supplier';
    }

    const nextPayNum = generateDocNumber(paymentType === 'Receipt' ? 'RCPT-' : 'PMT-');

    onCreatePayment({
      payment_number: nextPayNum,
      date: getTodayDateString(),
      party_type: partyType,
      party_id: partyId,
      party_name: partyName,
      payment_type: paymentType,
      amount,
      payment_method: paymentMethod,
      reference_number: referenceNumber.trim() || undefined,
      invoice_id: invoiceId || undefined,
      notes: notes.trim() || undefined,
    });

    setShowModal(false);
    setAmount(0);
    setReferenceNumber('');
    setNotes('');
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Payments & Receipts Management</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Dynamic UPI Enabled
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Record customer remittance receipts, supplier payments, and generate instant dynamic UPI QR codes
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Dynamic UPI QR Button */}
          <button
            onClick={() => handleOpenDynamicUPI()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-md hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-xs border border-indigo-800"
          >
            <QrCode className="w-4 h-4 text-indigo-200" />
            <span>⚡ Dynamic UPI QR</span>
          </button>

          <button
            onClick={() => handleOpenModal('Receipt')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Customer Receipt</span>
          </button>

          <button
            onClick={() => handleOpenModal('Payment')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Supplier Payment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Total Customer Inflow Receipts</span>
          <p className="text-xl font-bold text-emerald-600 font-mono mt-1 tabular-nums">{formatINR(totalReceipts)}</p>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Total Supplier Outflows</span>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1 tabular-nums">{formatINR(totalOutflows)}</p>
        </div>

        <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-indigo-900">Pending Receivables (UPI Ready)</span>
            <p className="text-xl font-bold text-indigo-700 font-mono mt-1 tabular-nums">
              {formatINR(totalPendingReceivables)}
            </p>
          </div>
          <button
            onClick={() => handleOpenDynamicUPI()}
            className="px-2.5 py-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors flex items-center gap-1"
          >
            <QrCode className="w-3 h-3" />
            <span>Collect</span>
          </button>
        </div>
      </div>

      {/* Quick Unpaid Invoices Carousel / Bar */}
      {pendingInvoices.length > 0 && (
        <div className="p-3.5 bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 text-white rounded-xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                Quick UPI Collection ({pendingInvoices.length} Unpaid Invoices)
              </h3>
            </div>
            <span className="text-[11px] text-slate-300">
              Click any invoice below to generate a customer-ready UPI QR code with pre-filled balance
            </span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
            {pendingInvoices.slice(0, 6).map((inv) => (
              <div
                key={inv.id}
                onClick={() => handleOpenDynamicUPI(inv)}
                className="shrink-0 p-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg cursor-pointer transition-all min-w-[200px] flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-mono text-xs font-bold text-white">{inv.invoice_number}</div>
                  <div className="text-[10px] text-indigo-200 truncate max-w-[110px]">{inv.customer_name}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-300 text-xs">{formatINR(inv.balance_due)}</div>
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-300 bg-indigo-950/60 px-1 rounded">
                    <QrCode className="w-2.5 h-2.5" />
                    QR
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Tabs Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by payment #, party, UTR reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md outline-hidden text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {(
            [
              { id: 'ALL', label: 'All Transactions' },
              { id: 'Receipt', label: 'Customer Receipts' },
              { id: 'Payment', label: 'Supplier Payments' },
              { id: 'PendingUPI', label: 'Pending Invoices' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                typeFilter === t.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Transactions / Pending Invoices Table */}
      {typeFilter === 'PendingUPI' ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Pending Invoices Ready for Dynamic UPI QR Generation
            </span>
            <span className="text-[11px] text-slate-500">
              Showing {pendingInvoices.length} pending bill{pendingInvoices.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold">
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Invoice Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3 text-right">Grand Total (₹)</th>
                  <th className="py-3 px-3 text-right">Paid (₹)</th>
                  <th className="py-3 px-3 text-right">Balance Due (₹)</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      All invoices are fully paid! No pending collections.
                    </td>
                  </tr>
                ) : (
                  pendingInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900 font-mono">{inv.invoice_number}</td>
                      <td className="py-3 px-3 text-slate-600">{inv.invoice_date}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{inv.customer_name}</td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">{formatINR(inv.grand_total)}</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-600 tabular-nums">
                        {formatINR(inv.paid_amount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-indigo-700 tabular-nums">
                        {formatINR(inv.balance_due)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleOpenDynamicUPI(inv)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-2xs"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Generate QR</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold">
                  <th className="py-3 px-3">Receipt / Voucher #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Party Name</th>
                  <th className="py-3 px-3 text-center">Type</th>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-3">Ref / UTR Number</th>
                  <th className="py-3 px-3 text-right">Amount (₹)</th>
                  <th className="py-3 px-3">Created By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No payment records found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900 font-mono">{p.payment_number}</td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{p.date}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{p.party_name}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.payment_type === 'Receipt'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.payment_type === 'Receipt' ? 'Inward Receipt' : 'Outward Payment'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        <span className="inline-flex items-center gap-1">
                          {p.payment_method === 'UPI' && <Smartphone className="w-3 h-3 text-indigo-600" />}
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">{p.reference_number || '-'}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                        <span className={p.payment_type === 'Receipt' ? 'text-emerald-700' : 'text-slate-900'}>
                          {formatINR(p.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{p.created_by}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Record {paymentType === 'Receipt' ? 'Customer Receipt' : 'Supplier Payment'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Party ({partyType}) *</label>
                <select
                  value={partyId}
                  onChange={(e) => setPartyId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-medium text-slate-900"
                >
                  {partyType === 'Customer'
                    ? customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} · Bal: {formatINR(c.current_balance)}
                        </option>
                      ))
                    : suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.company_name} · Due: {formatINR(s.current_balance)}
                        </option>
                      ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Amount Received / Paid (₹) *</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-base font-bold font-mono text-slate-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Payment Channel / Mode *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT / RTGS)</option>
                  <option value="UPI">UPI / Dynamic QR Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Transaction Ref / Cheque # / UTR</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-998821034"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Notes / Remarks</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800"
                >
                  Save Payment Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic UPI QR Generation Modal */}
      <DynamicUPIPaymentModal
        isOpen={showUPIModal}
        onClose={() => setShowUPIModal(false)}
        initialInvoice={selectedInvoiceForUPI}
        invoices={invoices}
        customers={customers}
        company={company}
        onRecordPaymentSuccess={(paymentData) => {
          onCreatePayment(paymentData);
        }}
      />
    </div>
  );
}
