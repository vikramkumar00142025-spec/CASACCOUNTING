'use client';

import React, { useState, useMemo } from 'react';
import { ShoppingCart, Plus, Search, Download, Eye, Upload, Sparkles } from 'lucide-react';
import { PurchaseInvoice } from '@/types';
import { formatINR } from '@/lib/gst-calculator';

interface PurchaseListViewProps {
  purchases: PurchaseInvoice[];
  onOpenCreateModal: () => void;
  onOpenScanModal?: () => void;
}

export default function PurchaseListView({
  purchases,
  onOpenCreateModal,
  onOpenScanModal,
}: PurchaseListViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchSearch =
        p.purchase_number.toLowerCase().includes(search.toLowerCase()) ||
        p.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
        (p.supplier_invoice_no && p.supplier_invoice_no.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || p.payment_status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [purchases, search, statusFilter]);

  const totalProcured = filteredPurchases.reduce((acc, p) => acc + p.grand_total, 0);
  const totalDue = filteredPurchases.reduce((acc, p) => acc + p.balance_due, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Purchase Invoices & Inward GRN</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track procurement bills, automatic stock additions and vendor credit payables</p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenScanModal && (
            <button
              onClick={onOpenScanModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Scan Bill (PDF/JPG)</span>
            </button>
          )}

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Purchase Bill</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Total Purchase Orders</span>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">{filteredPurchases.length}</p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Gross Procurement Total</span>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1 tabular-nums">{formatINR(totalProcured)}</p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Outstanding Vendor Payables</span>
          <p className="text-xl font-bold text-amber-600 font-mono mt-1 tabular-nums">{formatINR(totalDue)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by PO #, supplier name, ref #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md outline-hidden text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1">
          {['ALL', 'Paid', 'Partially Paid', 'Unpaid', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold">
                <th className="py-3 px-3">Purchase #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Supplier Bill Ref</th>
                <th className="py-3 px-3">Supplier Name</th>
                <th className="py-3 px-3 text-right">Taxable</th>
                <th className="py-3 px-3 text-right">Input GST</th>
                <th className="py-3 px-3 text-right">Grand Total</th>
                <th className="py-3 px-3 text-right">Payable Due</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No purchase invoices found.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 font-mono">{po.purchase_number}</td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{po.purchase_date}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{po.supplier_invoice_no || '-'}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{po.supplier_name}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                      {formatINR(po.subtotal - po.total_discount)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                      {formatINR(po.total_gst)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatINR(po.grand_total)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                      {po.balance_due > 0 ? (
                        <span className="text-amber-600">{formatINR(po.balance_due)}</span>
                      ) : (
                        <span className="text-slate-400">₹0.00</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          po.payment_status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : po.payment_status === 'Partially Paid'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {po.payment_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
