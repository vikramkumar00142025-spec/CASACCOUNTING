'use client';

import React, { useState, useMemo } from 'react';
import { Boxes, Search, Download, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';
import { InventoryTransaction } from '@/types';

interface InventoryTransactionsViewProps {
  transactions: InventoryTransaction[];
}

export default function InventoryTransactionsView({
  transactions,
}: InventoryTransactionsViewProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        t.product_name.toLowerCase().includes(search.toLowerCase()) ||
        (t.reference_number && t.reference_number.toLowerCase().includes(search.toLowerCase())) ||
        (t.notes && t.notes.toLowerCase().includes(search.toLowerCase()));

      const matchType = typeFilter === 'ALL' || t.transaction_type === typeFilter;
      return matchSearch && matchType;
    });
  }, [transactions, search, typeFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Inventory Movement Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">Complete audit trail of every stock inflow, outbound dispatch and transfer</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product, reference #, narration..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md outline-hidden text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {['ALL', 'Opening', 'Purchase', 'Sales', 'Sales Return', 'Purchase Return', 'Stock Adjustment', 'Stock Transfer'].map(
            (tp) => (
              <button
                key={tp}
                onClick={() => setTypeFilter(tp)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  typeFilter === tp
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tp}
              </button>
            )
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold">
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Warehouse</th>
                <th className="py-3 px-3 text-center">Movement Type</th>
                <th className="py-3 px-3 text-right">Quantity Delta</th>
                <th className="py-3 px-3 text-right">Stock (Before &gt; After)</th>
                <th className="py-3 px-3">Reference Document</th>
                <th className="py-3 px-3">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No stock movements logged.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                      {new Date(t.created_at).toLocaleString([], {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{t.product_name}</td>
                    <td className="py-3 px-3 text-slate-600">{t.warehouse_name}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          t.quantity > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {t.transaction_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                      <span className={t.quantity > 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                      <span>{t.previous_stock}</span>
                      <span className="mx-1 text-slate-400">&rarr;</span>
                      <strong className="text-slate-900 font-bold">{t.new_stock}</strong>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-800 font-mono">{t.reference_number || t.reference_type}</p>
                      {t.notes && <p className="text-[10px] text-slate-500 line-clamp-1">{t.notes}</p>}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{t.created_by_name}</td>
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
