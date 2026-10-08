'use client';

import React, { useState, useMemo } from 'react';
import { Truck, Plus, Search, Eye, Receipt, Download } from 'lucide-react';
import { DeliveryChallan } from '@/types';

interface ChallanListViewProps {
  challans: DeliveryChallan[];
  onOpenCreateModal: () => void;
  onSelectChallan: (challan: DeliveryChallan) => void;
  onConvertToInvoice: (challanId: string) => void;
}

export default function ChallanListView({
  challans,
  onOpenCreateModal,
  onSelectChallan,
  onConvertToInvoice,
}: ChallanListViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredChallans = useMemo(() => {
    return challans.filter((c) => {
      const matchSearch =
        c.challan_number.toLowerCase().includes(search.toLowerCase()) ||
        c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        (c.vehicle_number && c.vehicle_number.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [challans, search, statusFilter]);

  const pendingCount = challans.filter((c) => c.status === 'Pending').length;
  const convertedCount = challans.filter((c) => c.status === 'Converted').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Delivery Challans & Dispatch</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage goods sent on approval, track transit and convert to tax invoices</p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Delivery Challan</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Total Challans</span>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">{challans.length}</p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Open / Pending Invoicing</span>
          <p className="text-xl font-bold text-amber-600 font-mono mt-1">{pendingCount}</p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Converted to Tax Invoices</span>
          <p className="text-xl font-bold text-emerald-600 font-mono mt-1">{convertedCount}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by challan #, customer, vehicle #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md outline-hidden text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1">
          {['ALL', 'Pending', 'Converted', 'Cancelled'].map((st) => (
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

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold">
                <th className="py-3 px-3">Challan #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Customer / Consignee</th>
                <th className="py-3 px-3">Transporter</th>
                <th className="py-3 px-3">Vehicle #</th>
                <th className="py-3 px-3 text-center">Items</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredChallans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No delivery challans found.
                  </td>
                </tr>
              ) : (
                filteredChallans.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 font-mono">{ch.challan_number}</td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{ch.challan_date}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{ch.customer_name}</td>
                    <td className="py-3 px-3 text-slate-600">{ch.transporter || 'Direct Delivery'}</td>
                    <td className="py-3 px-3 font-mono text-slate-700">{ch.vehicle_number || '-'}</td>
                    <td className="py-3 px-3 text-center font-mono font-semibold">{ch.items.length} items</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          ch.status === 'Converted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ch.status === 'Cancelled'
                            ? 'bg-slate-200 text-slate-600 line-through'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ch.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectChallan(ch)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="View / Print Challan"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {ch.status === 'Pending' && (
                          <button
                            onClick={() => onConvertToInvoice(ch.id)}
                            className="px-2 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                            title="Convert to Tax Invoice"
                          >
                            Convert to Invoice
                          </button>
                        )}
                      </div>
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
