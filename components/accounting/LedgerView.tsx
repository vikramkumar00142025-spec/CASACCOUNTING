'use client';

import React, { useState, useMemo } from 'react';
import { BookOpen, Download, Printer, Filter } from 'lucide-react';
import {
  Customer,
  Supplier,
  SalesInvoice,
  PurchaseInvoice,
  Payment,
  Expense,
} from '@/types';
import { formatINR } from '@/lib/gst-calculator';

interface LedgerViewProps {
  customers: Customer[];
  suppliers: Supplier[];
  invoices: SalesInvoice[];
  purchases: PurchaseInvoice[];
  payments: Payment[];
  expenses: Expense[];
}

type LedgerType = 'Customer' | 'Supplier' | 'Bank' | 'Cash' | 'Sales' | 'Purchase' | 'Expense';

interface LedgerEntryRow {
  date: string;
  reference: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
}

export default function LedgerView({
  customers,
  suppliers,
  invoices,
  purchases,
  payments,
  expenses,
}: LedgerViewProps) {
  const [ledgerType, setLedgerType] = useState<LedgerType>('Customer');
  const [selectedPartyId, setSelectedPartyId] = useState<string>(customers[0]?.id || '');

  // Compute ledger entries dynamically based on type
  const ledgerData = useMemo(() => {
    const rows: LedgerEntryRow[] = [];
    let runningBalance = 0;

    if (ledgerType === 'Customer') {
      const cust = customers.find((c) => c.id === selectedPartyId) || customers[0];
      if (!cust) return { partyName: 'Customer', rows: [], closingBalance: 0 };

      // Opening balance
      if (cust.opening_balance > 0) {
        runningBalance += cust.opening_balance;
        rows.push({
          date: cust.created_at.split('T')[0],
          reference: 'OPENING',
          particulars: 'To Opening Balance B/F',
          debit: cust.opening_balance,
          credit: 0,
          balance: runningBalance,
        });
      }

      // Customer sales invoices (Debit - increases receivable)
      const custInvoices = invoices.filter((i) => i.customer_id === cust.id && i.payment_status !== 'Cancelled');
      custInvoices.forEach((inv) => {
        runningBalance += inv.grand_total;
        rows.push({
          date: inv.invoice_date,
          reference: inv.invoice_number,
          particulars: 'To Sales A/c - Tax Invoice',
          debit: inv.grand_total,
          credit: 0,
          balance: runningBalance,
        });
      });

      // Customer receipts (Credit - decreases receivable)
      const custPayments = payments.filter((p) => p.party_id === cust.id && p.payment_type === 'Receipt');
      custPayments.forEach((pay) => {
        runningBalance -= pay.amount;
        rows.push({
          date: pay.date,
          reference: pay.payment_number,
          particulars: `By ${pay.payment_method} A/c - Receipt (${pay.reference_number || 'Cleared'})`,
          debit: 0,
          credit: pay.amount,
          balance: runningBalance,
        });
      });

      rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return { partyName: `${cust.name} (${cust.company_name || 'Individual'})`, rows, closingBalance: runningBalance };
    } else if (ledgerType === 'Supplier') {
      const supp = suppliers.find((s) => s.id === selectedPartyId) || suppliers[0];
      if (!supp) return { partyName: 'Supplier', rows: [], closingBalance: 0 };

      // Opening balance
      if (supp.opening_balance > 0) {
        runningBalance += supp.opening_balance;
        rows.push({
          date: supp.created_at.split('T')[0],
          reference: 'OPENING',
          particulars: 'By Opening Balance B/F',
          debit: 0,
          credit: supp.opening_balance,
          balance: runningBalance,
        });
      }

      // Supplier purchase bills (Credit - increases payable)
      const suppPurchases = purchases.filter((p) => p.supplier_id === supp.id && p.payment_status !== 'Cancelled');
      suppPurchases.forEach((po) => {
        runningBalance += po.grand_total;
        rows.push({
          date: po.purchase_date,
          reference: po.purchase_number,
          particulars: 'By Purchase A/c - Inward GRN',
          debit: 0,
          credit: po.grand_total,
          balance: runningBalance,
        });
      });

      // Supplier payments (Debit - decreases payable)
      const suppPayments = payments.filter((p) => p.party_id === supp.id && p.payment_type === 'Payment');
      suppPayments.forEach((pay) => {
        runningBalance -= pay.amount;
        rows.push({
          date: pay.date,
          reference: pay.payment_number,
          particulars: `To ${pay.payment_method} A/c - Remittance Payment`,
          debit: pay.amount,
          credit: 0,
          balance: runningBalance,
        });
      });

      rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return { partyName: `${supp.company_name} (${supp.name})`, rows, closingBalance: runningBalance };
    } else if (ledgerType === 'Bank') {
      // Bank Ledger (Receipts from customers/deposits debit bank, payments/expenses credit bank)
      payments.forEach((p) => {
        if (p.payment_method === 'Bank Transfer' || p.payment_method === 'UPI') {
          if (p.payment_type === 'Receipt') {
            runningBalance += p.amount;
            rows.push({
              date: p.date,
              reference: p.payment_number,
              particulars: `To ${p.party_name} - Customer Inflow`,
              debit: p.amount,
              credit: 0,
              balance: runningBalance,
            });
          } else {
            runningBalance -= p.amount;
            rows.push({
              date: p.date,
              reference: p.payment_number,
              particulars: `By ${p.party_name} - Supplier Payment`,
              debit: 0,
              credit: p.amount,
              balance: runningBalance,
            });
          }
        }
      });

      expenses.forEach((e) => {
        if (e.payment_method === 'Bank Transfer' || e.payment_method === 'UPI') {
          runningBalance -= e.total_amount;
          rows.push({
            date: e.date,
            reference: e.expense_number,
            particulars: `By ${e.category} - ${e.description}`,
            debit: 0,
            credit: e.total_amount,
            balance: runningBalance,
          });
        }
      });

      rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return { partyName: 'Bank Account Ledger (Electronic)', rows, closingBalance: runningBalance };
    } else {
      // General Cash Ledger
      payments.forEach((p) => {
        if (p.payment_method === 'Cash') {
          if (p.payment_type === 'Receipt') {
            runningBalance += p.amount;
            rows.push({
              date: p.date,
              reference: p.payment_number,
              particulars: `To Cash Inflow - ${p.party_name}`,
              debit: p.amount,
              credit: 0,
              balance: runningBalance,
            });
          } else {
            runningBalance -= p.amount;
            rows.push({
              date: p.date,
              reference: p.payment_number,
              particulars: `By Cash Payment - ${p.party_name}`,
              debit: 0,
              credit: p.amount,
              balance: runningBalance,
            });
          }
        }
      });
      rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return { partyName: 'Cash in Hand Ledger', rows, closingBalance: runningBalance };
    }
  }, [ledgerType, selectedPartyId, customers, suppliers, invoices, purchases, payments, expenses]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print-hide">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Double-Entry Financial Ledgers</h1>
          <p className="text-xs text-slate-500 mt-0.5">Generate party statements of account, audit debit/credit vouchers and track balances</p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>Print Statement</span>
        </button>
      </div>

      {/* Ledger Selector Bar */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-3 print-hide">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(['Customer', 'Supplier', 'Bank', 'Cash'] as const).map((lt) => (
            <button
              key={lt}
              onClick={() => {
                setLedgerType(lt);
                if (lt === 'Customer') setSelectedPartyId(customers[0]?.id || '');
                if (lt === 'Supplier') setSelectedPartyId(suppliers[0]?.id || '');
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                ledgerType === lt
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {lt} Ledger
            </button>
          ))}
        </div>

        {ledgerType === 'Customer' && (
          <select
            value={selectedPartyId}
            onChange={(e) => setSelectedPartyId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 font-semibold"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.company_name ? `(${c.company_name})` : ''}
              </option>
            ))}
          </select>
        )}

        {ledgerType === 'Supplier' && (
          <select
            value={selectedPartyId}
            onChange={(e) => setSelectedPartyId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 font-semibold"
          >
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.company_name} - {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Statement Sheet */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-4 printable-document">
        <div className="flex items-start justify-between border-b pb-4 border-slate-200">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Statement of Account</span>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">{ledgerData.partyName}</h2>
            <p className="text-xs text-slate-500">FY 2026-27 Accounting Period</p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-500">Closing Balance:</span>
            <p className="text-lg font-bold font-mono text-slate-900 tabular-nums">
              {formatINR(ledgerData.closingBalance)}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Reference / Doc #</th>
                <th className="py-2.5 px-3">Particulars / Narration</th>
                <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                <th className="py-2.5 px-3 text-right">Running Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledgerData.rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No transactions recorded in this ledger period.
                  </td>
                </tr>
              ) : (
                ledgerData.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-slate-600 font-mono whitespace-nowrap">{row.date}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{row.reference}</td>
                    <td className="py-2.5 px-3 text-slate-800">{row.particulars}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                      {row.debit > 0 ? formatINR(row.debit) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                      {row.credit > 0 ? formatINR(row.credit) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-slate-900">
                      {formatINR(row.balance)}
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
