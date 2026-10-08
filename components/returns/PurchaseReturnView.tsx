'use client';

import React, { useState } from 'react';
import { RotateCcw, Plus, ShoppingCart, AlertCircle } from 'lucide-react';
import { PurchaseInvoice, PurchaseReturn } from '@/types';
import { formatINR } from '@/lib/gst-calculator';
import { getTodayDateString, generateDocNumber } from '@/lib/utils';

interface PurchaseReturnViewProps {
  purchaseReturns: PurchaseReturn[];
  purchases: PurchaseInvoice[];
  onCreateReturn: (data: Omit<PurchaseReturn, 'id' | 'company_id' | 'created_by' | 'created_at'>) => { success: boolean };
}

export default function PurchaseReturnView({
  purchaseReturns,
  purchases,
  onCreateReturn,
}: PurchaseReturnViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(purchases[0]?.id || '');
  const [reason, setReason] = useState('Damaged / Defective consignment returned to vendor');
  const [returnQty, setReturnQty] = useState<Record<string, number>>({});

  const selectedPurchase = purchases.find((p) => p.id === selectedPurchaseId);

  const handleOpenModal = () => {
    if (purchases.length > 0) {
      setSelectedPurchaseId(purchases[0].id);
      const initQty: Record<string, number> = {};
      purchases[0].items.forEach((item) => {
        initQty[item.product_id] = 1;
      });
      setReturnQty(initQty);
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchase) return;

    const returnItems = selectedPurchase.items
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
      return_number: generateDocNumber('PR-'),
      return_date: getTodayDateString(),
      purchase_id: selectedPurchase.id,
      purchase_number: selectedPurchase.purchase_number,
      supplier_id: selectedPurchase.supplier_id,
      supplier_name: selectedPurchase.supplier_name,
      debit_note_number: generateDocNumber('DN-2627-'),
      items: returnItems,
      total_amount: totalAmount,
      reason,
      warehouse_id: selectedPurchase.warehouse_id,
    });

    setShowModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Purchase Returns & Debit Notes</h1>
          <p className="text-xs text-slate-500 mt-0.5">Issue debit vouchers to vendors, reduce inventory and adjust accounts payable</p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Debit Note</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold">
                <th className="py-3 px-3">Debit Note #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Purchase Order Ref</th>
                <th className="py-3 px-3">Supplier / Vendor</th>
                <th className="py-3 px-3">Return Reason</th>
                <th className="py-3 px-3 text-right">Debit Value (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseReturns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No purchase returns or debit notes recorded yet.
                  </td>
                </tr>
              ) : (
                purchaseReturns.map((pr) => (
                  <tr key={pr.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 font-mono">{pr.debit_note_number}</td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{pr.return_date}</td>
                    <td className="py-3 px-3 font-mono text-emerald-600 font-medium">{pr.purchase_number}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{pr.supplier_name}</td>
                    <td className="py-3 px-3 text-slate-600">{pr.reason}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatINR(pr.total_amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Issue Purchase Return Debit Note</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Select Purchase Invoice *</label>
                <select
                  value={selectedPurchaseId}
                  onChange={(e) => setSelectedPurchaseId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-medium text-slate-900"
                >
                  {purchases.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.purchase_number} · {p.supplier_name} ({formatINR(p.grand_total)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedPurchase && (
                <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <span className="font-bold text-slate-700 block">Specify Return Quantity</span>
                  <div className="space-y-2">
                    {selectedPurchase.items.map((item) => (
                      <div key={item.product_id} className="flex items-center justify-between gap-3 bg-white p-2 rounded border border-slate-200">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 truncate">{item.product_name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">Purchased: {item.quantity} {item.unit}</p>
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
                <label className="font-semibold text-slate-700">Reason for Vendor Debit Note</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-800"
                  required
                />
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
                  Confirm Debit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
