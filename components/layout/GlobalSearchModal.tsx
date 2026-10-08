'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Receipt, Truck, Boxes, Users, Building2, ShoppingCart, ArrowRight, X } from 'lucide-react';
import { Product, Customer, Supplier, SalesInvoice, DeliveryChallan, PurchaseInvoice } from '@/types';
import { formatINR } from '@/lib/gst-calculator';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: SalesInvoice[];
  challans: DeliveryChallan[];
  purchases: PurchaseInvoice[];
  onSelectResult: (category: string, id: string) => void;
}

export default function GlobalSearchModal({
  isOpen,
  onClose,
  products,
  customers,
  suppliers,
  invoices,
  challans,
  purchases,
  onSelectResult,
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const matchedProducts = products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.includes(q)) ||
          p.category.toLowerCase().includes(q)
      )
      .slice(0, 4);

    const matchedInvoices = invoices
      .filter(
        (i) =>
          i.invoice_number.toLowerCase().includes(q) ||
          i.customer_name.toLowerCase().includes(q)
      )
      .slice(0, 4);

    const matchedChallans = challans
      .filter(
        (c) =>
          c.challan_number.toLowerCase().includes(q) ||
          c.customer_name.toLowerCase().includes(q)
      )
      .slice(0, 3);

    const matchedCustomers = customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.company_name && c.company_name.toLowerCase().includes(q)) ||
          c.phone.includes(q)
      )
      .slice(0, 3);

    const matchedSuppliers = suppliers
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.company_name.toLowerCase().includes(q)
      )
      .slice(0, 3);

    const matchedPurchases = purchases
      .filter(
        (p) =>
          p.purchase_number.toLowerCase().includes(q) ||
          p.supplier_name.toLowerCase().includes(q)
      )
      .slice(0, 3);

    const total =
      matchedProducts.length +
      matchedInvoices.length +
      matchedChallans.length +
      matchedCustomers.length +
      matchedSuppliers.length +
      matchedPurchases.length;

    return {
      products: matchedProducts,
      invoices: matchedInvoices,
      challans: matchedChallans,
      customers: matchedCustomers,
      suppliers: matchedSuppliers,
      purchases: matchedPurchases,
      total,
    };
  }, [query, products, invoices, challans, customers, suppliers, purchases]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by invoice number, product SKU, barcode, customer, challan..."
            className="w-full pl-3 pr-2 text-sm bg-transparent outline-hidden text-slate-900 placeholder:text-slate-400"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {!query && (
            <div className="py-8 text-center text-xs text-slate-400">
              <p>Type keywords to search across invoices, delivery challans, products, customers, and purchase bills.</p>
              <div className="flex items-center justify-center gap-2 mt-3 text-slate-500 font-mono text-[11px]">
                <span className="px-2 py-0.5 bg-slate-100 rounded">INV-</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded">DC-</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded">ZEN-</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded">PO-</span>
              </div>
            </div>
          )}

          {query && results && results.total === 0 && (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching records found for <span className="font-semibold text-slate-800">&quot;{query}&quot;</span>.
            </div>
          )}

          {results && results.invoices.length > 0 && (
            <div>
              <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Receipt className="w-3 h-3 text-blue-500" />
                <span>Sales Invoices</span>
              </p>
              <div className="space-y-1">
                {results.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      onSelectResult('invoices', inv.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">{inv.invoice_number}</span>
                      <span className="text-slate-500 ml-2">· {inv.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-slate-900">{formatINR(inv.grand_total)}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results && results.challans.length > 0 && (
            <div>
              <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Truck className="w-3 h-3 text-indigo-500" />
                <span>Delivery Challans</span>
              </p>
              <div className="space-y-1">
                {results.challans.map((ch) => (
                  <div
                    key={ch.id}
                    onClick={() => {
                      onSelectResult('challans', ch.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">{ch.challan_number}</span>
                      <span className="text-slate-500 ml-2">· {ch.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{ch.items.length} items</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results && results.products.length > 0 && (
            <div>
              <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Boxes className="w-3 h-3 text-amber-500" />
                <span>Products & Stock</span>
              </p>
              <div className="space-y-1">
                {results.products.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectResult('products', p.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {p.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-7 h-7 rounded-md object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-md bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200">
                          <Boxes className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-slate-900">{p.name}</span>
                        <span className="text-slate-400 font-mono ml-2">({p.sku})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-700">{p.current_stock} in stock</span>
                      <span className="font-mono font-medium text-slate-900">{formatINR(p.selling_price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results && results.customers.length > 0 && (
            <div>
              <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3 h-3 text-emerald-500" />
                <span>Customers</span>
              </p>
              <div className="space-y-1">
                {results.customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectResult('customers', c.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">{c.name}</span>
                      {c.company_name && <span className="text-slate-500 ml-2">· {c.company_name}</span>}
                    </div>
                    <span className="text-slate-500">{c.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-400 flex items-center justify-between">
          <span>ZenithERP Fast Finder</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
