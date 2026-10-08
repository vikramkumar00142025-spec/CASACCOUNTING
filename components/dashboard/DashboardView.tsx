'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Receipt,
  ShoppingCart,
  Wallet,
  Boxes,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  Warehouse as WarehouseIcon,
  Sparkles,
  ArrowRightLeft,
  SlidersHorizontal,
  Package,
  Building2,
  Shield,
  FileText,
  Truck,
  Layers,
  Lock,
} from 'lucide-react';
import {
  SalesInvoice,
  PurchaseInvoice,
  Payment,
  Expense,
  Product,
  Customer,
  Supplier,
  DeliveryChallan,
  Warehouse,
  InventoryTransaction,
  UserProfile,
} from '@/types';
import { formatINR } from '@/lib/gst-calculator';

interface DashboardViewProps {
  invoices: SalesInvoice[];
  purchases: PurchaseInvoice[];
  payments: Payment[];
  expenses: Expense[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  challans: DeliveryChallan[];
  warehouses?: Warehouse[];
  transactions?: InventoryTransaction[];
  currentUser: UserProfile;
  onNavigate: (tab: string) => void;
  onOpenCreateModal: (type: 'invoice' | 'challan' | 'purchase' | 'product') => void;
  onSelectInvoice: (invoice: SalesInvoice) => void;
  onOpenScanModal?: (docType: 'purchase' | 'stock' | 'auto') => void;
  onOpenAdjustmentModal?: (product: Product) => void;
  onOpenTransferModal?: (product: Product) => void;
}

type DateFilter = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'this_year';

export default function DashboardView({
  invoices,
  purchases,
  payments,
  expenses,
  products,
  customers,
  suppliers,
  challans,
  warehouses = [],
  transactions = [],
  currentUser,
  onNavigate,
  onOpenCreateModal,
  onSelectInvoice,
  onOpenScanModal,
  onOpenAdjustmentModal,
  onOpenTransferModal,
}: DashboardViewProps) {
  const [dateFilter, setDateFilter] = useState<DateFilter>('this_month');

  // Exact Granular Checklist Permission Checks
  const isSuperOrAdmin = currentUser.role === 'Super Admin' || currentUser.role === 'Admin';
  const perms = currentUser.permissions || [];

  const hasSales =
    isSuperOrAdmin ||
    perms.includes('view_sales') ||
    perms.includes('create_sales') ||
    perms.includes('manage_challans') ||
    perms.includes('view_customers');

  const hasInventory =
    isSuperOrAdmin ||
    perms.includes('view_products') ||
    perms.includes('create_products') ||
    perms.includes('manage_inventory');

  const hasPurchases =
    isSuperOrAdmin ||
    perms.includes('view_purchases') ||
    perms.includes('create_purchases') ||
    perms.includes('view_suppliers');

  const hasFinance =
    isSuperOrAdmin ||
    perms.includes('view_accounting') ||
    perms.includes('manage_payments') ||
    perms.includes('manage_expenses');

  const hasReports = isSuperOrAdmin || perms.includes('view_reports');

  // Determine specific role category focus
  const isStockOnly = hasInventory && !hasSales && !hasPurchases && !hasFinance;
  const isSalesOnly = hasSales && !hasInventory && !hasPurchases && !hasFinance;
  const isPurchaseOnly = hasPurchases && !hasSales && !hasInventory && !hasFinance;
  const hasNoCategories = !hasSales && !hasInventory && !hasPurchases && !hasFinance && !hasReports;

  // Aggregated KPIs
  const stats = useMemo(() => {
    const totalSales = invoices
      .filter((i) => i.payment_status !== 'Cancelled')
      .reduce((acc, i) => acc + i.grand_total, 0);

    const totalPurchases = purchases
      .filter((p) => p.payment_status !== 'Cancelled')
      .reduce((acc, p) => acc + p.grand_total, 0);

    const totalReceivables = customers.reduce((acc, c) => acc + c.current_balance, 0);
    const totalPayables = suppliers.reduce((acc, s) => acc + s.current_balance, 0);

    const totalExpenses = expenses.reduce((acc, e) => acc + e.total_amount, 0);

    const totalCollections = payments
      .filter((p) => p.payment_type === 'Receipt')
      .reduce((acc, p) => acc + p.amount, 0);

    const stockValue = products.reduce((acc, p) => acc + p.current_stock * p.purchase_price, 0);
    const totalStockUnits = products.reduce((acc, p) => acc + p.current_stock, 0);

    const lowStockProducts = products.filter((p) => p.current_stock > 0 && p.current_stock <= (p.min_stock || 5));
    const outOfStockProducts = products.filter((p) => p.current_stock <= 0);

    const pendingInvoices = invoices.filter((i) => i.balance_due > 0 && i.payment_status !== 'Cancelled');
    const pendingChallans = challans.filter((c) => c.status === 'Pending');

    return {
      totalSales,
      totalPurchases,
      totalReceivables,
      totalPayables,
      totalExpenses,
      totalCollections,
      stockValue,
      totalStockUnits,
      lowStockProducts,
      outOfStockProducts,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      pendingInvoicesCount: pendingInvoices.length,
      pendingChallansCount: pendingChallans.length,
    };
  }, [invoices, purchases, payments, expenses, products, customers, suppliers, challans]);

  // Top selling products (for Sales & Master views)
  const topProducts = useMemo(() => {
    const itemMap: Record<string, { name: string; quantity: number; totalSales: number; sku: string }> = {};

    invoices.forEach((inv) => {
      if (inv.payment_status === 'Cancelled') return;
      inv.items.forEach((item) => {
        if (!itemMap[item.product_id]) {
          const prod = products.find((p) => p.id === item.product_id);
          itemMap[item.product_id] = {
            name: item.product_name,
            quantity: 0,
            totalSales: 0,
            sku: prod?.sku || '',
          };
        }
        itemMap[item.product_id].quantity += item.quantity;
        itemMap[item.product_id].totalSales += item.total || 0;
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);
  }, [invoices, products]);

  // Top value inventory items (for Stock views)
  const topValueStock = useMemo(() => {
    return [...products]
      .sort((a, b) => b.current_stock * b.purchase_price - a.current_stock * a.purchase_price)
      .slice(0, 5);
  }, [products]);

  // Stock by warehouse calculation
  const warehouseStockSummary = useMemo(() => {
    return warehouses.map((wh) => {
      const whProducts = products.filter((p) => p.warehouse_id === wh.id);
      const totalUnits = whProducts.reduce((sum, p) => sum + p.current_stock, 0);
      const totalVal = whProducts.reduce((sum, p) => sum + p.current_stock * p.purchase_price, 0);
      return {
        ...wh,
        itemCount: whProducts.length,
        totalUnits,
        totalVal,
      };
    });
  }, [warehouses, products]);

  // Monthly Sales Bar Visualization
  const monthlyData = [
    { month: 'Apr', sales: 124000, purchases: 98000 },
    { month: 'May', sales: 185000, purchases: 140000 },
    { month: 'Jun', sales: 210000, purchases: 165000 },
    { month: 'Jul', sales: 245000, purchases: 180000 },
    { month: 'Aug', sales: 310000, purchases: 220000 },
    { month: 'Sep', sales: stats.totalSales || 252520, purchases: stats.totalPurchases || 193520 },
  ];

  const maxVal = Math.max(...monthlyData.map((d) => Math.max(d.sales, d.purchases)));

  // If user has NO category permissions selected at all
  if (hasNoCategories) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">No Category Permissions Assigned</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Your user account ({currentUser.email}) currently has no active module checklist items enabled.
            Please ask an administrator to assign categories in <strong>User Management &gt; Permission Checklist</strong>.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 1. INVENTORY STAFF / STOCK IN-CHARGE DASHBOARD (ONLY INVENTORY & STOCK)
  // =========================================================================
  if (isStockOnly) {
    return (
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/20">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Inventory & Stock Command Center</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Stock Category Checklist Active
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Real-time stock valuation, warehouse distribution, reorder alerts & movement ledgers for {currentUser.full_name}.
              </p>
            </div>
          </div>

          {/* Quick Stock Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenScanModal && (
              <button
                type="button"
                onClick={() => onOpenScanModal('stock')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Scan Stock (PDF/JPG)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenCreateModal('product')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Item</span>
            </button>
          </div>
        </div>

        {/* Stock KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Stock Valuation</span>
              <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Boxes className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
                {formatINR(stats.stockValue)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Total asset value across catalog</p>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Available Units</span>
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Package className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
                {stats.totalStockUnits.toLocaleString()} units
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Across {products.length} active SKUs</p>
            </div>
          </div>

          <div
            onClick={() => onNavigate('products')}
            className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-amber-300 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Low Stock Reorder Alert</span>
              <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-amber-600 font-mono tabular-nums">
                {stats.lowStockCount} items
              </p>
              <p className="text-[11px] text-amber-700 font-medium mt-1">Below minimum threshold</p>
            </div>
          </div>

          <div
            onClick={() => onNavigate('products')}
            className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-red-300 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Out of Stock Items</span>
              <span className="p-2 rounded-lg bg-red-50 text-red-600">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-red-600 font-mono tabular-nums">
                {stats.outOfStockCount} items
              </p>
              <p className="text-[11px] text-red-600 font-medium mt-1">Urgent restocking required</p>
            </div>
          </div>
        </div>

        {/* Warehouse Depots Breakdown */}
        {warehouseStockSummary.length > 0 && (
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Warehouse Stock Distribution</h2>
                <p className="text-xs text-slate-500">Real-time inventory levels across storage facilities</p>
              </div>
              <button
                onClick={() => onNavigate('warehouses')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Manage Warehouses
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {warehouseStockSummary.map((wh) => (
                <div key={wh.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <WarehouseIcon className="w-4 h-4 text-amber-600" />
                      <span className="font-bold text-slate-900 text-xs">{wh.name}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                      {wh.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 truncate">{wh.address || 'Central Storage Area'}</p>
                  <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">{wh.totalUnits} Units ({wh.itemCount} SKUs)</span>
                    <span className="font-bold text-slate-900 font-mono">{formatINR(wh.totalVal)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Urgent Low Stock Alert Table & Top Stock Items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Low Stock Attention List */}
          <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Items Requiring Reorder / Attention</h2>
                <p className="text-xs text-slate-500">Products currently at or below minimum threshold</p>
              </div>
              <button
                onClick={() => onNavigate('products')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {stats.lowStockProducts.length === 0 && stats.outOfStockProducts.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50/50 border border-emerald-100 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-emerald-900">All Stock Levels Optimal</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">No products currently below minimum stock threshold.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                      <th className="py-2.5 px-3">Item Name & SKU</th>
                      <th className="py-2.5 px-3 text-right">Available</th>
                      <th className="py-2.5 px-3 text-right">Min Level</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...stats.outOfStockProducts, ...stats.lowStockProducts].slice(0, 6).map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-slate-900">{prod.name}</p>
                          <span className="text-[10px] font-mono text-slate-400">{prod.sku} • {prod.category}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                          {prod.current_stock} {prod.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                          {prod.min_stock || 5} {prod.unit}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              prod.current_stock <= 0
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {prod.current_stock <= 0 ? 'Out of Stock' : 'Low Stock'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                          {formatINR(prod.purchase_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top Valuation Items */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Highest Value Inventory</h2>
                <p className="text-xs text-slate-500">Ranked by total on-hand asset value</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {topValueStock.map((p) => {
                const totalAssetVal = p.current_stock * p.purchase_price;
                return (
                  <div key={p.id} className="flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-900 truncate">{p.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {p.current_stock} {p.unit} × {formatINR(p.purchase_price)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-amber-800 tabular-nums">
                        {formatINR(totalAssetVal)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Stock Movements / Transaction Feed */}
        {transactions.length > 0 && (
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Recent Stock Movement Ledger</h2>
                <p className="text-xs text-slate-500">Latest recorded inward, outward, and audit adjustments</p>
              </div>
              <button
                onClick={() => onNavigate('inventory-transactions')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>View Full Movement Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                    <th className="py-2.5 px-3">Date / Time</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3">Warehouse</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3">Reason / Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.slice(0, 5).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                        {tx.created_at ? tx.created_at.split('T')[0] : 'Recent'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.transaction_type === 'Purchase' || tx.quantity > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{tx.product_name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{tx.warehouse_name || 'Main Warehouse'}</td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono">
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] truncate max-w-xs">
                        {tx.notes || tx.reference_number || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. SALES STAFF / SALES HOLDER DASHBOARD (ONLY SALES INVOICE CATEGORIES)
  // =========================================================================
  if (isSalesOnly) {
    return (
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-linear-to-r from-blue-500/10 via-blue-500/5 to-transparent border border-blue-200/80 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Sales & Billing Command Center</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                  Sales Category Checklist Active
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Tax invoices, customer collections, delivery challans & dispatch metrics for {currentUser.full_name}.
              </p>
            </div>
          </div>

          {/* Quick Sales Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onOpenCreateModal('challan')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-900 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-lg transition-colors shadow-2xs"
            >
              <Truck className="w-3.5 h-3.5 text-blue-700" />
              <span>Create Delivery Challan</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenCreateModal('invoice')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Sales Invoice</span>
            </button>
          </div>
        </div>

        {/* Sales KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Gross Sales Revenue</span>
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Receipt className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
                {formatINR(stats.totalSales)}
              </p>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">Confirmed billing revenue</p>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Collections Received</span>
              <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
                {formatINR(stats.totalCollections)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {invoices.filter((i) => i.payment_status === 'Paid').length} invoices cleared
              </p>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Outstanding Receivables</span>
              <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-amber-600 font-mono tabular-nums">
                {formatINR(stats.totalReceivables)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">{stats.pendingInvoicesCount} invoices pending</p>
            </div>
          </div>

          <div
            onClick={() => onNavigate('challans')}
            className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-blue-300 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Open Delivery Challans</span>
              <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Truck className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-blue-600 font-mono tabular-nums">
                {stats.pendingChallansCount} Pending
              </p>
              <p className="text-[11px] text-blue-700 font-medium mt-1">Ready for invoice conversion</p>
            </div>
          </div>
        </div>

        {/* Sales Chart & Top Selling Items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Monthly Sales Billing Trend</h2>
                <p className="text-xs text-slate-500">Monthly invoicing performance for FY 2026-27</p>
              </div>
            </div>

            <div className="h-56 flex items-end justify-between gap-4 pt-6 pb-2 border-b border-slate-100">
              {monthlyData.map((d) => {
                const salesPct = Math.round((d.sales / maxVal) * 100);
                return (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="w-full flex items-end justify-center h-full">
                      <div
                        style={{ height: `${salesPct}%` }}
                        className="w-6 sm:w-10 bg-blue-600 rounded-t-sm hover:bg-blue-700 transition-all relative group-hover:shadow-md"
                        title={`Sales: ${formatINR(d.sales)}`}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">{d.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Top Moving Products</h2>
                <p className="text-xs text-slate-500">Ranked by gross sales volume</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{p.sku} · {p.quantity} units dispatched</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-slate-900 tabular-nums">{formatINR(p.totalSales)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Sales Invoices Table */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Sales Invoices</h2>
              <p className="text-xs text-slate-500">Latest customer invoices and payment balances</p>
            </div>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View All Invoices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Taxable</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                  <th className="py-2.5 px-3 text-right">Due Balance</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.slice(0, 6).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 font-mono">{inv.invoice_number}</td>
                    <td className="py-3 px-3 text-slate-600">{inv.invoice_date}</td>
                    <td className="py-3 px-3 font-medium text-slate-900">{inv.customer_name}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                      {formatINR(inv.taxable_amount)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatINR(inv.grand_total)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 tabular-nums">
                      {inv.balance_due > 0 ? (
                        <span className="text-amber-600 font-semibold">{formatINR(inv.balance_due)}</span>
                      ) : (
                        <span className="text-slate-400">₹0.00</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          inv.payment_status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.payment_status === 'Partially Paid'
                            ? 'bg-amber-100 text-amber-800'
                            : inv.payment_status === 'Cancelled'
                            ? 'bg-slate-100 text-slate-600 line-through'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {inv.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSelectInvoice(inv)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                      >
                        View / Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. PURCHASES ONLY DASHBOARD
  // =========================================================================
  if (isPurchaseOnly) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-linear-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200/80 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Procurement & Vendor Command Center</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Purchases Category Active
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Inward purchase bills, vendor dues, and procurement analytics for {currentUser.full_name}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenScanModal && (
              <button
                type="button"
                onClick={() => onOpenScanModal('purchase')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>Scan Bill (PDF/JPG)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenCreateModal('purchase')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Purchase Bill</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Procurement Spend</span>
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <ShoppingCart className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
                {formatINR(stats.totalPurchases)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Total recorded vendor purchase bills</p>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Supplier Payables Outstanding</span>
              <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-amber-600 font-mono tabular-nums">
                {formatINR(stats.totalPayables)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Pending payments to {suppliers.length} vendors</p>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Active Vendor Directory</span>
              <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
                {suppliers.length} suppliers
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Registered suppliers & distributors</p>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Purchase Bills Count</span>
              <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <FileText className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
                {purchases.length} bills
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Inward invoices recorded</p>
            </div>
          </div>
        </div>

        {/* Recent Purchases Table */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Purchase Invoices</h2>
              <p className="text-xs text-slate-500">Inward supplier bills and payment balances</p>
            </div>
            <button
              onClick={() => onNavigate('purchases')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View All Purchases</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Purchase #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3 text-right">Taxable</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                  <th className="py-2.5 px-3 text-right">Due Balance</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.slice(0, 6).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 font-mono">{p.purchase_number}</td>
                    <td className="py-3 px-3 text-slate-600">{p.purchase_date}</td>
                    <td className="py-3 px-3 font-medium text-slate-900">{p.supplier_name}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                      {formatINR(p.subtotal)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatINR(p.grand_total)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 tabular-nums">
                      {p.balance_due > 0 ? (
                        <span className="text-amber-600 font-semibold">{formatINR(p.balance_due)}</span>
                      ) : (
                        <span className="text-slate-400">₹0.00</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          p.payment_status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. MULTI-CATEGORY / DYNAMIC CHECKLIST DASHBOARD
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Top Header with Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {isSuperOrAdmin ? 'Executive Enterprise Dashboard' : 'Custom Workspace Dashboard'}
            </h1>
            <div className="flex items-center gap-1.5">
              {hasSales && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Sales Active
                </span>
              )}
              {hasInventory && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Stock Active
                </span>
              )}
              {hasPurchases && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Purchases Active
                </span>
              )}
              {hasFinance && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Finance Active
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Displaying categories configured in permission checklist for {currentUser.full_name} ({currentUser.role}).
          </p>
        </div>

        {/* Date Filter Bar */}
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg shadow-xs overflow-x-auto">
          {[
            { id: 'today', label: 'Today' },
            { id: 'this_week', label: 'This Week' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'this_year', label: 'FY 2026-27' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateFilter(tab.id as DateFilter)}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                dateFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: High Level Financial Metric Cards (Strictly filtered by checklist) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        {hasSales && (
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Gross Sales Revenue</span>
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Receipt className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
                {formatINR(stats.totalSales)}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-600 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+18.4% vs last period</span>
              </div>
            </div>
          </div>
        )}

        {/* Total Collections */}
        {(hasSales || hasFinance) && (
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Collections (Received)</span>
              <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
                {formatINR(stats.totalCollections)}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 font-medium">
                <span>{invoices.filter((i) => i.payment_status === 'Paid').length} invoices fully cleared</span>
              </div>
            </div>
          </div>
        )}

        {/* Total Customer Receivables */}
        {hasSales && (
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Outstanding Receivables</span>
              <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-amber-600 font-mono tabular-nums">
                {formatINR(stats.totalReceivables)}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 font-medium">
                <span>{stats.pendingInvoicesCount} invoices pending payment</span>
              </div>
            </div>
          </div>
        )}

        {/* Total Stock Value */}
        {hasInventory && (
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Stock Valuation</span>
              <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Boxes className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
                {formatINR(stats.stockValue)}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 font-medium">
                <span>Across {products.length} active SKUs ({stats.totalStockUnits.toLocaleString()} units)</span>
              </div>
            </div>
          </div>
        )}

        {/* Total Purchases (if no Sales active but Purchases active) */}
        {!hasSales && hasPurchases && (
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Procurement Spend</span>
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <ShoppingCart className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
                {formatINR(stats.totalPurchases)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Across {purchases.length} recorded bills</p>
            </div>
          </div>
        )}
      </div>

      {/* Row 2: Secondary Operational Alert Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {hasInventory && (
          <div
            onClick={() => onNavigate('products')}
            className="p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 cursor-pointer transition-colors shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Low Stock Alert</span>
              {stats.lowStockCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500" />}
            </div>
            <p className="mt-1 text-lg font-bold font-mono text-amber-600 tabular-nums">{stats.lowStockCount} items</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Below reorder point</p>
          </div>
        )}

        {hasPurchases && (
          <div
            onClick={() => onNavigate('purchases')}
            className="p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 cursor-pointer transition-colors shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Supplier Payables</span>
              <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="mt-1 text-lg font-bold font-mono text-slate-900 tabular-nums">
              {formatINR(stats.totalPayables)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{suppliers.length} active vendors</p>
          </div>
        )}

        {hasFinance && (
          <div
            onClick={() => onNavigate('expenses')}
            className="p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 cursor-pointer transition-colors shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Operating Expenses</span>
              <Wallet className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="mt-1 text-lg font-bold font-mono text-slate-900 tabular-nums">
              {formatINR(stats.totalExpenses)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{expenses.length} expense entries</p>
          </div>
        )}

        {hasSales && (
          <div
            onClick={() => onNavigate('challans')}
            className="p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 cursor-pointer transition-colors shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Open Challans</span>
              <span className="text-[11px] font-mono text-blue-600 font-semibold">{stats.pendingChallansCount}</span>
            </div>
            <p className="mt-1 text-lg font-bold font-mono text-slate-900 tabular-nums">
              {stats.pendingChallansCount} Pending
            </p>
            <p className="text-[10px] text-blue-600 hover:underline mt-0.5 font-medium">Ready to convert</p>
          </div>
        )}
      </div>

      {/* Row 3: Visualizations and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {hasSales && (
          <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Revenue & Inward Trend (FY 2026-27)</h2>
                <p className="text-xs text-slate-500">Monthly billing volume comparison</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-slate-900" />
                  <span className="text-slate-600 font-medium">Sales</span>
                </div>
                {hasPurchases && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-blue-300" />
                    <span className="text-slate-600 font-medium">Purchases</span>
                  </div>
                )}
              </div>
            </div>

            <div className="h-56 flex items-end justify-between gap-4 pt-6 pb-2 border-b border-slate-100">
              {monthlyData.map((d) => {
                const salesPct = Math.round((d.sales / maxVal) * 100);
                const purchasesPct = Math.round((d.purchases / maxVal) * 100);
                return (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1.5 h-full">
                      <div
                        style={{ height: `${salesPct}%` }}
                        className="w-4 sm:w-6 bg-slate-900 rounded-t-xs hover:bg-slate-800 transition-all relative group-hover:shadow-md"
                        title={`Sales: ${formatINR(d.sales)}`}
                      />
                      {hasPurchases && (
                        <div
                          style={{ height: `${purchasesPct}%` }}
                          className="w-4 sm:w-6 bg-blue-300 rounded-t-xs hover:bg-blue-400 transition-all"
                          title={`Purchases: ${formatINR(d.purchases)}`}
                        />
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">{d.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* If no sales but inventory active, show warehouse summary in place of chart */}
        {!hasSales && hasInventory && warehouseStockSummary.length > 0 && (
          <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Warehouse Stock Distribution</h2>
                <p className="text-xs text-slate-500">Real-time inventory levels across storage facilities</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {warehouseStockSummary.map((wh) => (
                <div key={wh.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{wh.name}</span>
                    <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {wh.code}
                    </span>
                  </div>
                  <div className="mt-2 text-xs flex justify-between text-slate-600">
                    <span>{wh.totalUnits} Units</span>
                    <span className="font-bold text-slate-900">{formatINR(wh.totalVal)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Moving Inventory or Top Value Stock */}
        {hasSales && (
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Top Moving Inventory</h2>
                <p className="text-xs text-slate-500">Ranked by gross sales volume</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{p.sku} · {p.quantity} units dispatched</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-slate-900 tabular-nums">{formatINR(p.totalSales)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasSales && hasInventory && (
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Highest Value Inventory</h2>
                <p className="text-xs text-slate-500">Ranked by on-hand asset value</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {topValueStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {p.current_stock} {p.unit} × {formatINR(p.purchase_price)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-amber-800 tabular-nums">
                      {formatINR(p.current_stock * p.purchase_price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Row 4: Recent Invoices Table (If Sales Enabled) */}
      {hasSales && (
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Sales Invoices</h2>
              <p className="text-xs text-slate-500">Latest confirmed GST bills and payment statuses</p>
            </div>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View All Invoices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Taxable</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                  <th className="py-2.5 px-3 text-right">Due Balance</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.slice(0, 5).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 font-mono">{inv.invoice_number}</td>
                    <td className="py-3 px-3 text-slate-600">{inv.invoice_date}</td>
                    <td className="py-3 px-3 font-medium text-slate-900">{inv.customer_name}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                      {formatINR(inv.taxable_amount)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatINR(inv.grand_total)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 tabular-nums">
                      {inv.balance_due > 0 ? (
                        <span className="text-amber-600 font-semibold">{formatINR(inv.balance_due)}</span>
                      ) : (
                        <span className="text-slate-400">₹0.00</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          inv.payment_status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.payment_status === 'Partially Paid'
                            ? 'bg-amber-100 text-amber-800'
                            : inv.payment_status === 'Cancelled'
                            ? 'bg-slate-100 text-slate-600 line-through'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {inv.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSelectInvoice(inv)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                      >
                        View / Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Row 5: Recent Stock Movements (If Inventory Enabled & No Sales) */}
      {!hasSales && hasInventory && transactions.length > 0 && (
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Stock Movement Ledger</h2>
              <p className="text-xs text-slate-500">Latest recorded inward, outward, and audit adjustments</p>
            </div>
            <button
              onClick={() => onNavigate('inventory-transactions')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View Full Movement Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Date / Time</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3">Warehouse</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3">Reason / Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                      {tx.created_at ? tx.created_at.split('T')[0] : 'Recent'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.transaction_type === 'Purchase' || tx.quantity > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{tx.product_name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{tx.warehouse_name || 'Main Warehouse'}</td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono">
                      {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] truncate max-w-xs">
                      {tx.notes || tx.reference_number || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
