'use client';

import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Download,
  Filter,
  Eye,
  CreditCard,
  Ban,
  Share2,
  Calendar,
  QrCode,
} from 'lucide-react';
import { SalesInvoice } from '@/types';
import { formatINR } from '@/lib/gst-calculator';

interface InvoiceListViewProps {
  invoices: SalesInvoice[];
  onOpenCreateModal: () => void;
  onSelectInvoice: (invoice: SalesInvoice) => void;
  onRecordPayment: (invoice: SalesInvoice) => void;
  onOpenUPIQR?: (invoice: SalesInvoice) => void;
}

export default function InvoiceListView({
  invoices,
  onOpenCreateModal,
  onSelectInvoice,
  onRecordPayment,
  onOpenUPIQR,
}: InvoiceListViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        inv.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        (inv.customer_gstin && inv.customer_gstin.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' || inv.payment_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const totalBilled = filteredInvoices
    .filter((i) => i.payment_status !== 'Cancelled')
    .reduce((sum, i) => sum + i.grand_total, 0);

  const totalOutstanding = filteredInvoices
    .filter((i) => i.payment_status !== 'Cancelled')
    .reduce((sum, i) => sum + i.balance_due, 0);

  const exportCSV = () => {
    const headers = [
      'Invoice Number',
      'Date',
      'Due Date',
      'Customer',
      'GSTIN',
      'Subtotal',
      'Taxable Amount',
      'CGST',
      'SGST',
      'IGST',
      'Grand Total',
      'Paid',
      'Balance Due',
      'Status',
    ];
    const rows = filteredInvoices.map((i) => [
      i.invoice_number,
      i.invoice_date,
      i.due_date,
      `"${i.customer_name}"`,
      i.customer_gstin || '',
      i.subtotal,
      i.taxable_amount,
      i.total_cgst,
      i.total_sgst,
      i.total_igst,
      i.grand_total,
      i.paid_amount,
      i.balance_due,
      i.payment_status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Sales Invoices & GST Billing</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage tax invoices, calculate GST output liability and track receivables</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Sales Invoice</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Total Filtered Invoices</span>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">{filteredInvoices.length}</p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Gross Billed Value</span>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1 tabular-nums">{formatINR(totalBilled)}</p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Outstanding Balance Due</span>
          <p className="text-xl font-bold text-amber-600 font-mono mt-1 tabular-nums">{formatINR(totalOutstanding)}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice #, customer name, GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md outline-hidden text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-300"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'Confirmed', 'Partially Paid', 'Paid', 'Cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {status}
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
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3 text-right">Taxable</th>
                <th className="py-3 px-3 text-right">GST Output</th>
                <th className="py-3 px-3 text-right">Grand Total</th>
                <th className="py-3 px-3 text-right">Paid</th>
                <th className="py-3 px-3 text-right">Balance Due</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No sales invoices found matching your search.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 font-mono">{inv.invoice_number}</td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{inv.invoice_date}</td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900">{inv.customer_name}</p>
                      {inv.customer_gstin && (
                        <p className="text-[10px] text-slate-400 font-mono">{inv.customer_gstin}</p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                      {formatINR(inv.taxable_amount)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                      {formatINR(inv.total_cgst + inv.total_sgst + inv.total_igst)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatINR(inv.grand_total)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-700 tabular-nums">
                      {formatINR(inv.paid_amount)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                      {inv.balance_due > 0 ? (
                        <span className="text-amber-600">{formatINR(inv.balance_due)}</span>
                      ) : (
                        <span className="text-slate-400">₹0.00</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          inv.payment_status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.payment_status === 'Partially Paid'
                            ? 'bg-amber-100 text-amber-800'
                            : inv.payment_status === 'Cancelled'
                            ? 'bg-slate-200 text-slate-600 line-through'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {inv.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectInvoice(inv)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="View / Print Invoice"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {inv.balance_due > 0 && inv.payment_status !== 'Cancelled' && (
                          <>
                            {onOpenUPIQR && (
                              <button
                                onClick={() => onOpenUPIQR(inv)}
                                className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded"
                                title="Generate Dynamic UPI QR for customer"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onRecordPayment(inv)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                              title="Record Customer Receipt"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          </>
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
