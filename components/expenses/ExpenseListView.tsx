'use client';

import React, { useState, useMemo } from 'react';
import { Wallet, Plus, Search, Tag } from 'lucide-react';
import { Expense, ExpenseCategory } from '@/types';
import { formatINR } from '@/lib/gst-calculator';
import { getTodayDateString, generateDocNumber } from '@/lib/utils';

interface ExpenseListViewProps {
  expenses: Expense[];
  onCreateExpense: (data: Omit<Expense, 'id' | 'company_id' | 'created_by' | 'created_at'>) => { success: boolean };
}

export default function ExpenseListView({
  expenses,
  onCreateExpense,
}: ExpenseListViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Form
  const [category, setCategory] = useState<ExpenseCategory>('Rent');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [vendorName, setVendorName] = useState('');
  const [notes, setNotes] = useState('');

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.expense_number.toLowerCase().includes(search.toLowerCase()) ||
        (e.vendor_name && e.vendor_name.toLowerCase().includes(search.toLowerCase()));

      const matchCat = categoryFilter === 'ALL' || e.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [expenses, search, categoryFilter]);

  const totalExpense = filtered.reduce((s, e) => s + e.total_amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description.trim()) return;

    const nextExpNumber = generateDocNumber('EXP-');
    const total = amount + taxAmount;

    onCreateExpense({
      expense_number: nextExpNumber,
      date: getTodayDateString(),
      category,
      description: description.trim(),
      amount,
      tax_amount: taxAmount,
      total_amount: total,
      payment_method: paymentMethod,
      vendor_name: vendorName.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setShowModal(false);
    setDescription('');
    setAmount(0);
    setTaxAmount(0);
    setVendorName('');
    setNotes('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Operational Expenses</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track rent, utilities, employee compensation, freight and overheads</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Expense</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Total Filtered Entries</span>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">{filtered.length}</p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Gross Expenditure</span>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1 tabular-nums">{formatINR(totalExpense)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search expenses by description, vendor, #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md outline-hidden text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-800"
        >
          <option value="ALL">All Categories</option>
          <option value="Rent">Rent</option>
          <option value="Salary">Salary</option>
          <option value="Electricity">Electricity</option>
          <option value="Transport">Transport</option>
          <option value="Internet">Internet</option>
          <option value="Office Expense">Office Expense</option>
          <option value="Marketing">Marketing</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold">
                <th className="py-3 px-3">Expense #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Description & Vendor</th>
                <th className="py-3 px-3">Payment Mode</th>
                <th className="py-3 px-3 text-right">Tax (₹)</th>
                <th className="py-3 px-3 text-right">Total Amount (₹)</th>
                <th className="py-3 px-3">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 font-mono">{e.expense_number}</td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{e.date}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900">{e.description}</p>
                      {e.vendor_name && <p className="text-[10px] text-slate-500">Payee: {e.vendor_name}</p>}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{e.payment_method}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                      {formatINR(e.tax_amount)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatINR(e.total_amount)}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{e.created_by}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Record Business Expense</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Expense Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-medium text-slate-900"
                >
                  <option value="Rent">Rent</option>
                  <option value="Salary">Salary / Compensation</option>
                  <option value="Electricity">Electricity & Utilities</option>
                  <option value="Transport">Transport & Logistics</option>
                  <option value="Internet">Internet & Telecom</option>
                  <option value="Office Expense">Office Stationery & Supplies</option>
                  <option value="Marketing">Marketing & Advertising</option>
                  <option value="Maintenance">Maintenance & Repairs</option>
                  <option value="Other">Other Miscellaneous</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Description / Narration *</label>
                <input
                  type="text"
                  placeholder="e.g. Server hosting renewal"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Base Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 font-mono text-base font-bold border border-slate-300 rounded text-slate-900"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tax / GST (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 font-mono border border-slate-300 rounded text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Payment Channel</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900 bg-white"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Vendor / Payee</label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900"
                  />
                </div>
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
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
