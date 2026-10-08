'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  QrCode,
  Copy,
  Check,
  Share2,
  Download,
  Printer,
  CheckCircle2,
  Receipt,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Info,
  RefreshCw,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { SalesInvoice, Customer, CompanyProfile, Payment } from '@/types';
import { formatINR } from '@/lib/gst-calculator';
import { buildUPIUrl, buildWhatsAppPaymentMessage, downloadQRCodeElement } from '@/lib/upi';
import { getTodayDateString, generateDocNumber } from '@/lib/utils';

interface DynamicUPIPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInvoice?: SalesInvoice | null;
  invoices: SalesInvoice[];
  customers: Customer[];
  company: CompanyProfile;
  onRecordPaymentSuccess?: (data: Omit<Payment, 'id' | 'company_id' | 'created_by' | 'created_at'>) => void;
}

export default function DynamicUPIPaymentModal({
  isOpen,
  onClose,
  initialInvoice,
  invoices,
  customers,
  company,
  onRecordPaymentSuccess,
}: DynamicUPIPaymentModalProps) {
  // Filter unpaid or partially paid invoices to the top
  const pendingInvoices = invoices.filter(
    (inv) => inv.payment_status !== 'Cancelled' && inv.balance_due > 0
  );

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    initialInvoice?.id || pendingInvoices[0]?.id || invoices[0]?.id || ''
  );

  const currentInvoice = invoices.find((i) => i.id === selectedInvoiceId) || initialInvoice || null;

  // Custom amount & note overrides if edited by the user
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [customNote, setCustomNote] = useState<string | null>(null);

  const payAmount =
    customAmount !== null
      ? customAmount
      : currentInvoice
      ? currentInvoice.balance_due > 0
        ? currentInvoice.balance_due
        : currentInvoice.grand_total
      : 1000;

  const note =
    customNote !== null
      ? customNote
      : currentInvoice
      ? `Payment for ${currentInvoice.invoice_number}`
      : `Payment to ${company.name}`;

  const [upiId, setUpiId] = useState<string>(
    company.upi_id || 'zenithapex@hdfcbank'
  );
  const [payeeName, setPayeeName] = useState<string>(
    company.upi_payee_name || company.name
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [showUpiEdit, setShowUpiEdit] = useState(false);

  // Settlement Confirmation State
  const [isConfirmingPaid, setIsConfirmingPaid] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentSuccessNotice, setPaymentSuccessNotice] = useState(false);

  if (!isOpen) return null;

  // Build the dynamic standard UPI URI
  const upiUrl = buildUPIUrl({
    upiId,
    payeeName,
    amount: payAmount,
    transactionRef: currentInvoice ? currentInvoice.invoice_number : 'TXN-DIRECT',
    transactionNote: note || `Payment to ${payeeName}`,
    merchantCode: company.merchant_code || '5411',
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(upiUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWhatsAppShare = () => {
    if (!currentInvoice) return;
    const msg = buildWhatsAppPaymentMessage({
      invoiceNumber: currentInvoice.invoice_number,
      customerName: currentInvoice.customer_name,
      amountFormatted: formatINR(payAmount),
      dueDate: currentInvoice.due_date,
      companyName: company.name,
      upiId,
      upiUrl,
    });
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
  };

  const handleDownloadQR = () => {
    const filename = currentInvoice
      ? `${currentInvoice.invoice_number}_UPI_QR`
      : 'UPI_Payment_QR';
    downloadQRCodeElement('dynamic-upi-qr-container', filename);
  };

  const handlePrintStandee = () => {
    window.print();
  };

  const handleQuickAmount = (pct: number) => {
    if (!currentInvoice) return;
    const calculated = (currentInvoice.balance_due * pct) / 100;
    setCustomAmount(Math.round(calculated * 100) / 100);
  };

  const handleConfirmPaymentReceived = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInvoice || payAmount <= 0) return;

    const receiptNumber = generateDocNumber('RCPT-');
    const finalUtr = utrNumber.trim() || `UPI-${Date.now().toString().slice(-8)}`;

    if (onRecordPaymentSuccess) {
      onRecordPaymentSuccess({
        payment_number: receiptNumber,
        date: getTodayDateString(),
        party_type: 'Customer',
        party_id: currentInvoice.customer_id,
        party_name: currentInvoice.customer_name,
        payment_type: 'Receipt',
        amount: payAmount,
        payment_method: 'UPI',
        reference_number: finalUtr,
        invoice_id: currentInvoice.id,
        notes: `Dynamic UPI QR Collection for ${currentInvoice.invoice_number} (Ref: ${finalUtr})`,
      });
    }

    setPaymentSuccessNotice(true);
    setIsConfirmingPaid(false);
    setTimeout(() => {
      setPaymentSuccessNotice(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print-hide">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-emerald-600 flex items-center justify-center text-white shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Dynamic UPI QR Code Generator</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                  NPCI UPI 2.0
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Instant zero-fee scan & pay QR code directly linked to invoice breakdown
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {paymentSuccessNotice && (
          <div className="px-6 py-3 bg-emerald-500 text-white flex items-center gap-2 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Payment successfully marked as received! Customer receipt recorded and ledger updated.</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Configuration & Invoice Selection (7 Cols) */}
          <div className="lg:col-span-7 space-y-5 print-hide">
            {/* Invoice Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Select Target Invoice *</span>
                {pendingInvoices.length > 0 && (
                  <span className="text-[11px] font-medium text-emerald-600">
                    {pendingInvoices.length} pending collection{pendingInvoices.length > 1 ? 's' : ''}
                  </span>
                )}
              </label>

              <select
                value={selectedInvoiceId}
                onChange={(e) => {
                  setSelectedInvoiceId(e.target.value);
                  setCustomAmount(null);
                  setCustomNote(null);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <optgroup label="Pending / Unpaid Invoices">
                  {pendingInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} · {inv.customer_name} · Due: {formatINR(inv.balance_due)}
                    </option>
                  ))}
                </optgroup>
                {invoices.filter((i) => i.balance_due <= 0).length > 0 && (
                  <optgroup label="Fully Settled Invoices">
                    {invoices
                      .filter((i) => i.balance_due <= 0)
                      .map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoice_number} · {inv.customer_name} · [Settled {formatINR(inv.grand_total)}]
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Selected Invoice Details Card */}
            {currentInvoice && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Billed To:</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">{currentInvoice.customer_name}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 font-medium">Invoice Date:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{currentInvoice.invoice_date}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-medium uppercase">Grand Total</span>
                    <p className="font-bold font-mono text-slate-800 mt-0.5">{formatINR(currentInvoice.grand_total)}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-medium uppercase">Paid So Far</span>
                    <p className="font-bold font-mono text-emerald-600 mt-0.5">{formatINR(currentInvoice.paid_amount)}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-indigo-100 bg-indigo-50/30">
                    <span className="text-[10px] text-indigo-600 font-bold uppercase">Balance Due</span>
                    <p className="font-bold font-mono text-indigo-700 mt-0.5">{formatINR(currentInvoice.balance_due)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Amount Setting */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">QR Collection Amount (₹) *</label>
                {currentInvoice && currentInvoice.balance_due > 0 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(100)}
                      className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                    >
                      100% (Full)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(50)}
                      className="px-2 py-0.5 text-[11px] font-semibold bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(25)}
                      className="px-2 py-0.5 text-[11px] font-semibold bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors"
                    >
                      25%
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setCustomAmount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full pl-8 pr-4 py-2 text-lg font-bold font-mono text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  required
                />
              </div>
            </div>

            {/* Beneficiary VPA and Payee Details */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Beneficiary Remittance VPA</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUpiEdit(!showUpiEdit)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  {showUpiEdit ? 'Lock Defaults' : 'Change VPA / Name'}
                </button>
              </div>

              {showUpiEdit ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-500 font-medium">Merchant UPI VPA</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. business@icici"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-slate-900 font-medium mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-medium">Payee Business Name</label>
                    <input
                      type="text"
                      value={payeeName}
                      onChange={(e) => setPayeeName(e.target.value)}
                      placeholder="e.g. Zenith Apex"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900 font-medium mt-0.5"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <p className="font-mono font-bold text-slate-900">{upiId}</p>
                    <p className="text-[11px] text-slate-500">{payeeName}</p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                    Verified Merchant
                  </span>
                </div>
              )}
            </div>

            {/* Transaction Note */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">UPI Transaction Note (shown on payer phone)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setCustomNote(e.target.value)}
                maxLength={60}
                placeholder="e.g. Payment for INV-2627-001"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-800"
              />
            </div>

            {/* Mark as Received Action Trigger */}
            {!isConfirmingPaid ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmingPaid(true)}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Customer Paid via UPI? Confirm & Mark as Received</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmPaymentReceived} className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Confirm Customer Remittance</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingPaid(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="text-emerald-900 font-medium">Bank UTR / UPI Ref Number (Optional)</label>
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="e.g. UTR-321045982710 or leave blank for auto"
                    className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded text-slate-900 font-mono text-xs"
                  />
                  <p className="text-[10px] text-emerald-700">
                    Will auto-create a Customer Inflow Receipt of {formatINR(payAmount)} for {currentInvoice?.customer_name}.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-xs transition-colors"
                  >
                    Confirm & Update Books
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingPaid(false)}
                    className="px-3 py-2 bg-white text-slate-600 border border-emerald-200 rounded text-xs"
                  >
                    Dismiss
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Live Dynamic QR Display & Share Tools (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 bg-gradient-to-b from-slate-50 to-indigo-50/40 rounded-2xl border border-slate-200">
            {/* Standee Header (Visible in Print Standee) */}
            <div className="text-center mb-3">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest bg-indigo-100 px-2.5 py-0.5 rounded-full inline-block mb-1">
                Scan to Pay
              </span>
              <h3 className="font-extrabold text-slate-900 text-sm">{payeeName}</h3>
              <p className="text-xs text-slate-500 font-mono">{upiId}</p>
            </div>

            {/* The Live Rendered QR Code */}
            <div
              id="dynamic-upi-qr-container"
              className="p-4 bg-white rounded-2xl shadow-md border-2 border-slate-200 flex flex-col items-center relative group"
            >
              <QRCodeSVG
                value={upiUrl}
                size={210}
                level="M"
                includeMargin={true}
                className="rounded-lg"
              />

              {/* Center Logo / Badge Overlay */}
              <div className="mt-2 text-center">
                <span className="text-xs font-semibold text-slate-500">Payable Exact Amount</span>
                <p className="text-2xl font-black font-mono text-slate-900 tracking-tight">
                  {formatINR(payAmount)}
                </p>
              </div>
            </div>

            {/* Supported Apps Logos Bar */}
            <div className="mt-4 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Accepted via any UPI App
              </p>
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-600 flex-wrap">
                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md shadow-2xs">Google Pay</span>
                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md shadow-2xs">PhonePe</span>
                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md shadow-2xs">Paytm</span>
                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md shadow-2xs">BHIM</span>
                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md shadow-2xs">CRED</span>
              </div>
            </div>

            {/* Action Buttons: Copy, WhatsApp, Download, Print */}
            <div className="w-full grid grid-cols-2 gap-2 mt-5 print-hide">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy UPI Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-2xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadQR}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </button>

              <button
                type="button"
                onClick={handlePrintStandee}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Standee</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 print-hide">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Dynamic QR encodes invoice ref & amount. Customers do not need to type beneficiary VPA or amount manually.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
