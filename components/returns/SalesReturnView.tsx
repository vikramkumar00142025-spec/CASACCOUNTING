'use client';

import React, { useState } from 'react';
import { RotateCcw, Plus, Receipt, AlertCircle } from 'lucide-react';
import { SalesInvoice, SalesReturn } from '@/types';
import { formatINR } from '@/lib/gst-calculator';
import { getTodayDateString, generateDocNumber } from '@/lib/utils';

interface SalesReturnViewProps {
  salesReturns: SalesReturn[];
  invoices: SalesInvoice[];
  onCreateReturn: (data: Omit<SalesReturn, 'id' | 'company_id' | 'created_by' | 'created_at'>) => { success: boolean };
}

export default function SalesReturnView({
  salesReturns,
  invoices,
  onCreateReturn,
}: SalesReturnViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoices[0]?.id || '');
  const [reason, setReason] = useState('Damaged during transit / Customer replacement');
  const [returnQty, setReturnQty] = useState<Record<string, number>>({});

  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId);

  const handleOpenModal = () => {
    if (invoices.length > 0) {
      setSelectedInvoiceId(invoices[0].id);
      const initQty: Record<string, number> = {};
      invoices[0].items.forEach((item) => {
        initQty[item.product_id] = 1;
      });
      setReturnQty(initQty);
    }
    setShowModal(true);
  };

  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    const inv = invoices.find((i) => i.id === invId);
    if (inv) {
      const initQty: Record<string, number> = {};
      inv.items.forEach((item) => {
        initQty[item.product_id] = 1;
      });
      setReturnQty(initQty);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const returnItems = selectedInvoice.items
      .filter((item) => (returnQty[item.product_id] || 0) > 0)
      .map((item) => {
        const qty = returnQty[item.product_id] || 1;
        const gross = qty * item.rate;
        const total = gross + (gross * item.gst_rate) / 100;
        return {
          product_id: item.product_id,
          product_name: item.product_name,
          return_qty: qty,
          rate: item.rate,
          gst_rate: item.gst_rate,
          total: Number(total.toFixed(2)),
        };
      });

    if (returnItems.length === 0) return;

    const totalAmount = returnItems.reduce((acc, i) => acc + i.total, 0);

    onCreateReturn({
      return_number: generateDocNumber('SR-'),
      return_date: getTodayDateString(),
      invoice_id: selectedInvoice.id,
      invoice_number: selectedInvoice.invoice_number,
      customer_id: selectedInvoice.customer_id,
      customer_name: selectedInvoice.customer_name,
      credit_note_number: generateDocNumber('CN-2627-'),
      items: returnItems,
      total_amount: totalAmount,
      reason,
      warehouse_id: selectedInvoice.warehouse_id,
    });

    setShowModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Sales Returns & Credit Notes</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage customer return vouchers, re-stock inventory and adjust ledgers</p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Credit Note</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold">
                <th className="py-3 px-3">Credit Note #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Original Invoice</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Return Reason</th>
                <th className="py-3 px-3 text-right">Credit Value (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salesReturns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No sales returns or credit notes recorded yet.
                  </td>
                </tr>
              ) : (
                salesReturns.map((sr) => (
                  <tr key={sr.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 font-mono">{sr.credit_note_number}</td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{sr.return_date}</td>
                    <td className="py-3 px-3 font-mono text-blue-600 font-medium">{sr.invoice_number}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{sr.customer_name}</td>
                    <td className="py-3 px-3 text-slate-600">{sr.reason}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatINR(sr.total_amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Issue Sales Return Credit Note</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Select Original Sales Invoice *</label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-medium text-slate-900"
                >
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} · {inv.customer_name} ({formatINR(inv.grand_total)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedInvoice && (
                <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <span className="font-bold text-slate-700 block">Specify Return Quantity</span>
                  <div className="space-y-2">
                    {selectedInvoice.items.map((item) => (
                      <div key={item.product_id} className="flex items-center justify-between gap-3 bg-white p-2 rounded border border-slate-200">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 truncate">{item.product_name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">Billed: {item.quantity} {item.unit}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-slate-500">Return Qty:</label>
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={returnQty[item.product_id] ?? 0}
                            onChange={(e) =>
                              setReturnQty((prev) => ({
                                ...prev,
                                [item.product_id]: Math.min(item.quantity, Math.max(0, Number(e.target.value) || 0)),
                              }))
                            }
                            className="w-16 px-2 py-1 text-center font-mono font-bold border border-slate-300 rounded"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Return Reason</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-800"
                  required
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-slate-700 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Confirming this will automatically re-add items back into inventory and deduct the customer&apos;s ledger balance.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  Confirm Credit Note & Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
