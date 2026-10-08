'use client';

import React, { useState } from 'react';
import {
  Printer,
  Download,
  Share2,
  X,
  CreditCard,
  Ban,
  CheckCircle2,
  AlertCircle,
  FileText,
  QrCode,
} from 'lucide-react';
import { SalesInvoice, CompanyProfile } from '@/types';
import InvoicePrintTemplate from './InvoicePrintTemplate';
import { formatINR } from '@/lib/gst-calculator';
import DynamicUPIPaymentModal from '@/components/payments/DynamicUPIPaymentModal';

interface InvoiceDetailModalProps {
  invoice: SalesInvoice | null;
  company: CompanyProfile;
  onClose: () => void;
  onRecordPayment: (invoice: SalesInvoice) => void;
  onCancelInvoice: (invoiceId: string, reason: string) => void;
}

export default function InvoiceDetailModal({
  invoice,
  company,
  onClose,
  onRecordPayment,
  onCancelInvoice,
}: InvoiceDetailModalProps) {
  const [template, setTemplate] = useState<'Modern' | 'Professional' | 'Minimal' | 'Thermal'>('Modern');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showUPIModal, setShowUPIModal] = useState(false);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hello ${invoice.customer_name},\n\n` +
      `Here is your Tax Invoice *${invoice.invoice_number}* dated *${invoice.invoice_date}* from *${company.name}*.\n` +
      `Total Amount: *${formatINR(invoice.grand_total)}*\n` +
      `Balance Due: *${formatINR(invoice.balance_due)}*\n\n` +
      `Bank details for remittance:\n` +
      `Bank: ${company.bank_name}\n` +
      `A/C: ${company.account_number}\n` +
      `IFSC: ${company.ifsc}\n\n` +
      `Thank you for your business!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Controls Header (Hidden in Print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 bg-slate-50 print-hide">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900 text-sm">{invoice.invoice_number}</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                invoice.payment_status === 'Paid'
                  ? 'bg-emerald-100 text-emerald-800'
                  : invoice.payment_status === 'Partially Paid'
                  ? 'bg-amber-100 text-amber-800'
                  : invoice.payment_status === 'Cancelled'
                  ? 'bg-slate-200 text-slate-600 line-through'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {invoice.payment_status}
            </span>
          </div>

          {/* Template Selectors */}
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg text-xs">
            {(['Modern', 'Professional', 'Minimal', 'Thermal'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTemplate(t)}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  template === t ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {invoice.balance_due > 0 && invoice.payment_status !== 'Cancelled' && (
              <>
                <button
                  onClick={() => setShowUPIModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors shadow-xs"
                  title="Generate dynamic UPI QR for customer scan & pay"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>UPI QR</span>
                </button>

                <button
                  onClick={() => onRecordPayment(invoice)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Collect Payment</span>
                </button>
              </>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            {invoice.payment_status !== 'Cancelled' && (
              <button
                onClick={() => setShowCancelPrompt(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Cancel Invoice & Restore Stock"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cancel Prompt Inline Banner */}
        {showCancelPrompt && (
          <div className="p-4 bg-red-50 border-b border-red-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs print-hide">
            <div className="flex items-center gap-2 text-red-900">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Are you sure? Cancelling will automatically restore inventory to the warehouse.</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason (e.g. customer void)"
                className="px-2 py-1 text-xs bg-white border border-red-300 rounded outline-hidden text-slate-800"
              />
              <button
                onClick={() => {
                  onCancelInvoice(invoice.id, cancelReason);
                  setShowCancelPrompt(false);
                  onClose();
                }}
                className="px-3 py-1 bg-red-600 text-white font-semibold rounded hover:bg-red-700"
              >
                Confirm Cancel
              </button>
              <button
                onClick={() => setShowCancelPrompt(false)}
                className="px-2 py-1 text-slate-600 hover:text-slate-900"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Printable Document Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100">
          <InvoicePrintTemplate invoice={invoice} company={company} template={template} />
        </div>
      </div>

      {/* Dynamic UPI Payment Modal */}
      {showUPIModal && (
        <DynamicUPIPaymentModal
          isOpen={showUPIModal}
          onClose={() => setShowUPIModal(false)}
          initialInvoice={invoice}
          invoices={[invoice]}
          customers={[]}
          company={company}
          onRecordPaymentSuccess={() => {
            onRecordPayment(invoice);
            setShowUPIModal(false);
          }}
        />
      )}
    </div>
  );
}
