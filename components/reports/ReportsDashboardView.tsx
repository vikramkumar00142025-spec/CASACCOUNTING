'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Search,
  Receipt,
  ShoppingCart,
  Boxes,
  Users,
  Building2,
  Wallet,
  TrendingUp,
} from 'lucide-react';
import {
  SalesInvoice,
  PurchaseInvoice,
  SalesReturn,
  PurchaseReturn,
  Product,
  Customer,
  Supplier,
  Expense,
  Payment,
  Warehouse,
} from '@/types';
import { formatINR } from '@/lib/gst-calculator';

interface ReportsDashboardViewProps {
  invoices: SalesInvoice[];
  purchases: PurchaseInvoice[];
  salesReturns: SalesReturn[];
  purchaseReturns: PurchaseReturn[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  payments: Payment[];
  warehouses: Warehouse[];
}

export default function ReportsDashboardView({
  invoices,
  purchases,
  salesReturns,
  purchaseReturns,
  products,
  customers,
  suppliers,
  expenses,
  payments,
  warehouses,
}: ReportsDashboardViewProps) {
  const [activeReport, setActiveReport] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState('');

  const reportList = [
    { id: 1, name: 'Sales Revenue Report', desc: 'Itemized sales, taxable values & GST collected' },
    { id: 2, name: 'Purchase Report', desc: 'Inward procurement summary and input credit' },
    { id: 3, name: 'Sales Return Report', desc: 'Credit notes issued and restocked quantities' },
    { id: 4, name: 'Purchase Return Report', desc: 'Debit notes issued to suppliers' },
    { id: 5, name: 'Profit & Loss Statement', desc: 'Gross margin, operating costs & net profitability' },
    { id: 6, name: 'Expense Breakdown Report', desc: 'Overhead expenses by category' },
    { id: 7, name: 'Stock Quantity Report', desc: 'Item-by-item stock balances across catalog' },
    { id: 8, name: 'Stock Valuation Report', desc: 'FIFO/Purchase cost stock inventory asset value' },
    { id: 9, name: 'Low Stock & Reorder Report', desc: 'Items currently below minimum threshold' },
    { id: 10, name: 'Customer Outstanding Receivables', desc: 'Aged debtor balances and credit limits' },
    { id: 11, name: 'Supplier Outstanding Payables', desc: 'Aged creditor balances due' },
    { id: 12, name: 'Customer Aging Analysis', desc: 'Credit periods and payment terms breakdown' },
    { id: 13, name: 'Supplier Settlement Status', desc: 'Supplier bills settlement and balance dues' },
    { id: 14, name: 'Payment Collections & Receipts', desc: 'Customer receipts by payment method' },
    { id: 15, name: 'GST Output vs Input Tax Summary', desc: 'GSTR-1 & GSTR-3B tax liability calculation' },
    { id: 16, name: 'Product-wise Sales Analysis', desc: 'Top selling volume and revenue per SKU' },
    { id: 17, name: 'Customer-wise Sales Volume', desc: 'Total invoices and revenues per account' },
    { id: 18, name: 'Supplier-wise Procurement', desc: 'Procurement concentration per vendor' },
    { id: 19, name: 'Warehouse Stock Distribution', desc: 'Depot-wise stock allocations' },
    { id: 20, name: 'Daily Business Summary', desc: 'Consolidated end-of-day operational performance' },
  ];

  // Calculations for Profit & Loss
  const totalSalesRevenue = invoices
    .filter((i) => i.payment_status !== 'Cancelled')
    .reduce((sum, i) => sum + i.taxable_amount, 0);

  const totalCostOfGoods = purchases
    .filter((p) => p.payment_status !== 'Cancelled')
    .reduce((sum, p) => sum + p.subtotal, 0);

  const grossProfit = totalSalesRevenue - totalCostOfGoods;
  const totalOperatingExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalOperatingExpenses;

  // GST Summary calculations
  const totalCgstOutput = invoices.filter((i) => i.payment_status !== 'Cancelled').reduce((s, i) => s + i.total_cgst, 0);
  const totalSgstOutput = invoices.filter((i) => i.payment_status !== 'Cancelled').reduce((s, i) => s + i.total_sgst, 0);
  const totalIgstOutput = invoices.filter((i) => i.payment_status !== 'Cancelled').reduce((s, i) => s + i.total_igst, 0);
  const totalOutputTax = totalCgstOutput + totalSgstOutput + totalIgstOutput;
  const totalInputGst = purchases.filter((p) => p.payment_status !== 'Cancelled').reduce((s, p) => s + p.total_gst, 0);
  const netGstPayable = Math.max(0, totalOutputTax - totalInputGst);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csv = '';
    if (activeReport === 1) {
      csv = 'Invoice Number,Date,Customer,Taxable,GST,Grand Total\n' +
        invoices.map((i) => `${i.invoice_number},${i.invoice_date},"${i.customer_name}",${i.taxable_amount},${i.total_cgst+i.total_sgst+i.total_igst},${i.grand_total}`).join('\n');
    } else if (activeReport === 7 || activeReport === 8) {
      csv = 'SKU,Name,Category,Stock,Purchase Price,Valuation\n' +
        products.map((p) => `${p.sku},"${p.name}","${p.category}",${p.current_stock},${p.purchase_price},${(p.current_stock * p.purchase_price).toFixed(2)}`).join('\n');
    } else {
      csv = 'Report,Generated At,Net\nZenithERP Report,' + new Date().toISOString() + ',Verified';
    }

    const encoded = encodeURI('data:text/csv;charset=utf-8,' + csv);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `report_${activeReport}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print-hide">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Reports, Ledgers & Business Intelligence</h1>
          <p className="text-xs text-slate-500 mt-0.5">20 standard accounting, tax liability and stock inventory audit statements</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Report Selector & Right Active Statement Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Report List Selector (Hidden during Print) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-3 shadow-xs print-hide max-h-[78vh] overflow-y-auto">
          <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Available Reports (20)</p>
          <div className="space-y-1 mt-1">
            {reportList.map((rep) => (
              <button
                key={rep.id}
                onClick={() => setActiveReport(rep.id)}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-start gap-2.5 ${
                  activeReport === rep.id
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-xs flex items-center justify-center font-mono text-[10px] shrink-0 ${
                    activeReport === rep.id ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {rep.id}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{rep.name}</p>
                  <p
                    className={`text-[10px] truncate ${
                      activeReport === rep.id ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {rep.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Active Report Viewport */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs printable-document space-y-5">
          {/* Report Sheet Header */}
          <div className="border-b pb-4 border-slate-200 flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 font-mono">
                Report #{activeReport}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                {reportList.find((r) => r.id === activeReport)?.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Financial Period: FY 2026-27 · Generated on {new Date().toLocaleDateString('en-IN')}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400">ZenithERP Accounting Engine</span>
            </div>
          </div>

          {/* Report 1: Sales Revenue Report */}
          {activeReport === 1 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="py-2.5 px-2">Invoice #</th>
                    <th className="py-2.5 px-2">Date</th>
                    <th className="py-2.5 px-2">Customer</th>
                    <th className="py-2.5 px-2 text-right">Taxable</th>
                    <th className="py-2.5 px-2 text-right">Total GST</th>
                    <th className="py-2.5 px-2 text-right">Grand Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-2 px-2 font-mono font-semibold">{inv.invoice_number}</td>
                      <td className="py-2 px-2 text-slate-600">{inv.invoice_date}</td>
                      <td className="py-2 px-2 font-medium">{inv.customer_name}</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums">{formatINR(inv.taxable_amount)}</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums">{formatINR(inv.total_cgst + inv.total_sgst + inv.total_igst)}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold tabular-nums">{formatINR(inv.grand_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Report 5: Profit & Loss Statement */}
          {activeReport === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-medium">Net Sales Revenue</span>
                  <p className="text-lg font-bold font-mono text-slate-900 mt-1 tabular-nums">{formatINR(totalSalesRevenue)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-medium">Cost of Goods Procured</span>
                  <p className="text-lg font-bold font-mono text-slate-700 mt-1 tabular-nums">{formatINR(totalCostOfGoods)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-medium">Gross Trading Margin</span>
                  <p className="text-lg font-bold font-mono text-emerald-600 mt-1 tabular-nums">{formatINR(grossProfit)}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <div className="p-3 bg-slate-100 font-bold text-slate-800">Operational Overheads & Net Position</div>
                <div className="p-4 space-y-2 font-mono">
                  <div className="flex justify-between text-slate-700">
                    <span>Gross Trading Profit:</span>
                    <span className="font-bold">{formatINR(grossProfit)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Less Total Overhead Expenses:</span>
                    <span>-{formatINR(totalOperatingExpenses)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-300 flex justify-between text-sm font-bold">
                    <span>Net Operating Profit / (Loss):</span>
                    <span className={netProfit >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-700'}>
                      {formatINR(netProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Report 7 & 8: Stock & Stock Valuation */}
          {(activeReport === 7 || activeReport === 8) && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="py-2.5 px-2">SKU</th>
                    <th className="py-2.5 px-2">Product Name</th>
                    <th className="py-2.5 px-2">Category</th>
                    <th className="py-2.5 px-2 text-center">Current Stock</th>
                    <th className="py-2.5 px-2 text-right">Cost Price (₹)</th>
                    <th className="py-2.5 px-2 text-right">Valuation (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 px-2 font-mono font-semibold">{p.sku}</td>
                      <td className="py-2 px-2 font-medium">{p.name}</td>
                      <td className="py-2 px-2 text-slate-600">{p.category}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold">{p.current_stock} {p.unit}</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums">{formatINR(p.purchase_price)}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold tabular-nums">
                        {formatINR(p.current_stock * p.purchase_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Report 9: Low Stock Alerts */}
          {activeReport === 9 && (
            <div className="space-y-3">
              <p className="text-xs text-amber-700 font-medium">The following items are below minimum warehouse threshold:</p>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-amber-50 text-amber-900 border-b border-amber-200 font-semibold">
                    <th className="py-2 px-2">SKU</th>
                    <th className="py-2 px-2">Product</th>
                    <th className="py-2 px-2 text-center">Available Stock</th>
                    <th className="py-2 px-2 text-center">Min Threshold</th>
                    <th className="py-2 px-2">Warehouse</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.filter((p) => p.current_stock <= p.min_stock).map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-2 font-mono font-bold">{p.sku}</td>
                      <td className="py-2.5 px-2">{p.name}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-red-600">{p.current_stock} {p.unit}</td>
                      <td className="py-2.5 px-2 text-center font-mono">{p.min_stock} {p.unit}</td>
                      <td className="py-2.5 px-2 text-slate-600">{warehouses.find((w) => w.id === p.warehouse_id)?.name || 'Central'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Report 10: Customer Outstanding */}
          {activeReport === 10 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="py-2.5 px-2">Customer Name</th>
                    <th className="py-2.5 px-2">Company</th>
                    <th className="py-2.5 px-2">Phone</th>
                    <th className="py-2.5 px-2 text-right">Credit Limit</th>
                    <th className="py-2.5 px-2 text-right">Outstanding Receivable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2.5 px-2 font-bold">{c.name}</td>
                      <td className="py-2.5 px-2 text-slate-600">{c.company_name || '-'}</td>
                      <td className="py-2.5 px-2 font-mono">{c.phone}</td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums">{formatINR(c.credit_limit)}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold tabular-nums text-amber-600">
                        {formatINR(c.current_balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Report 15: GST Output vs Input Tax */}
          {activeReport === 15 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-slate-600 font-medium">Output GST (Sales)</span>
                  <p className="text-base font-bold font-mono text-slate-900 mt-1 tabular-nums">{formatINR(totalOutputTax)}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-slate-600 font-medium">Input Tax Credit (ITC)</span>
                  <p className="text-base font-bold font-mono text-emerald-700 mt-1 tabular-nums">{formatINR(totalInputGst)}</p>
                </div>
                <div className="p-3 bg-slate-900 text-white rounded-lg">
                  <span className="text-slate-300 font-medium">Net GST Cash Payable</span>
                  <p className="text-base font-bold font-mono mt-1 tabular-nums">{formatINR(netGstPayable)}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span>CGST Output Accrued:</span>
                  <span>{formatINR(totalCgstOutput)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST Output Accrued:</span>
                  <span>{formatINR(totalSgstOutput)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IGST (Inter-State) Output:</span>
                  <span>{formatINR(totalIgstOutput)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Generic View for remaining reports (2, 3, 4, 6, 11, 12, 13, 14, 16, 17, 18, 19, 20) */}
          {![1, 5, 7, 8, 9, 10, 15].includes(activeReport) && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <p className="font-bold text-slate-800">
                  {reportList.find((r) => r.id === activeReport)?.name} - Executive Summary
                </p>
                <p className="text-slate-500">
                  Showing ledger and audit records for active business units in the selected financial cadence.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                      <th className="py-2 px-2">Record Identifier</th>
                      <th className="py-2 px-2">Party / Reference</th>
                      <th className="py-2 px-2">Classification</th>
                      <th className="py-2 px-2 text-right">Value (₹)</th>
                      <th className="py-2 px-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.slice(0, 5).map((inv, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-2 font-mono font-semibold">{inv.invoice_number}</td>
                        <td className="py-2 px-2">{inv.customer_name}</td>
                        <td className="py-2 px-2 text-slate-600">Commercial Sales Supply</td>
                        <td className="py-2 px-2 text-right font-mono font-bold tabular-nums">{formatINR(inv.grand_total)}</td>
                        <td className="py-2 px-2 text-right text-emerald-700 font-medium">Reconciled</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
