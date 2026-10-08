'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, ShoppingCart, AlertTriangle } from 'lucide-react';
import { Supplier, Product, Warehouse, PurchaseInvoice, PurchaseInvoiceItem } from '@/types';
import { formatINR } from '@/lib/gst-calculator';
import { getTodayDateString, getFutureDateString, addDaysToDate, generateDocNumber } from '@/lib/utils';

interface CreatePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  products: Product[];
  warehouses: Warehouse[];
  purchasePrefix: string;
  onSavePurchase: (data: Omit<PurchaseInvoice, 'id' | 'company_id' | 'created_by' | 'created_at'>) => { success: boolean };
}

export default function CreatePurchaseModal({
  isOpen,
  onClose,
  suppliers,
  products,
  warehouses,
  purchasePrefix,
  onSavePurchase,
}: CreatePurchaseModalProps) {
  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(() => getTodayDateString());
  const [dueDate, setDueDate] = useState<string>(() => getFutureDateString(30));
  const [warehouseId, setWarehouseId] = useState<string>(warehouses[0]?.id || 'wh-1');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [notes, setNotes] = useState<string>('Goods received in order at central warehouse depot.');

  const [items, setItems] = useState<
    {
      product_id: string;
      product_name: string;
      unit: string;
      quantity: number;
      rate: number;
      discount_percent: number;
      gst_rate: number;
    }[]
  >([
    {
      product_id: products[0]?.id || '',
      product_name: products[0]?.name || '',
      unit: products[0]?.unit || 'Units',
      quantity: 10,
      rate: products[0]?.purchase_price || 1000,
      discount_percent: 0,
      gst_rate: products[0]?.gst_rate || 18,
    },
  ]);

  if (!isOpen) return null;

  const currentSupplier = suppliers.find((s) => s.id === supplierId);

  const computedItems: PurchaseInvoiceItem[] = items.map((item, idx) => {
    const gross = item.quantity * item.rate;
    const discount = (gross * item.discount_percent) / 100;
    const taxable = gross - discount;
    const gstAmt = (taxable * item.gst_rate) / 100;
    const total = taxable + gstAmt;

    return {
      id: 'pi-item-' + idx,
      product_id: item.product_id,
      product_name: item.product_name,
      unit: item.unit,
      quantity: item.quantity,
      rate: item.rate,
      discount_percent: item.discount_percent,
      taxable_amount: Number(taxable.toFixed(2)),
      gst_rate: item.gst_rate,
      gst_amount: Number(gstAmt.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  });

  const subtotal = computedItems.reduce((acc, i) => acc + i.quantity * i.rate, 0);
  const totalDiscount = computedItems.reduce((acc, i) => acc + (i.quantity * i.rate * i.discount_percent) / 100, 0);
  const totalGst = computedItems.reduce((acc, i) => acc + i.gst_amount, 0);
  const grandTotal = Number((subtotal - totalDiscount + totalGst).toFixed(2));
  const balanceDue = Math.max(0, Number((grandTotal - paidAmount).toFixed(2)));

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setItems((prev) =>
      prev.map((it, i) =>
        i === index
          ? {
              ...it,
              product_id: prod.id,
              product_name: prod.name,
              unit: prod.unit,
              rate: prod.purchase_price,
              gst_rate: prod.gst_rate,
            }
          : it
      )
    );
  };

  const handleAddItem = () => {
    const first = products[0];
    setItems((prev) => [
      ...prev,
      {
        product_id: first?.id || '',
        product_name: first?.name || 'Item',
        unit: first?.unit || 'Units',
        quantity: 5,
        rate: first?.purchase_price || 1000,
        discount_percent: 0,
        gst_rate: first?.gst_rate || 18,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSupplier) return;

    const nextPoNumber = generateDocNumber(purchasePrefix);
    const paymentStatus =
      paidAmount >= grandTotal ? 'Paid' : paidAmount > 0 ? 'Partially Paid' : 'Unpaid';

    onSavePurchase({
      purchase_number: nextPoNumber,
      supplier_invoice_no: supplierInvoiceNo.trim() || undefined,
      purchase_date: purchaseDate,
      due_date: dueDate,
      supplier_id: currentSupplier.id,
      supplier_name: currentSupplier.name + ' (' + currentSupplier.company_name + ')',
      supplier_gstin: currentSupplier.gstin,
      items: computedItems,
      subtotal,
      total_discount: totalDiscount,
      total_gst: totalGst,
      round_off: 0,
      grand_total: grandTotal,
      paid_amount: paidAmount,
      balance_due: balanceDue,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      warehouse_id: warehouseId,
      notes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Record Inward Purchase Bill</h2>
              <p className="text-xs text-slate-500">Record incoming stock and update vendor accounts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Section 1: Supplier & Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-700">Vendor / Supplier *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-medium text-slate-900"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.company_name} - {s.name} ({s.state})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Supplier Bill / Ref #</label>
              <input
                type="text"
                placeholder="e.g. VEND/26/901"
                value={supplierInvoiceNo}
                onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Purchase Date *</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setPurchaseDate(newDate);
                  if (newDate) {
                    setDueDate(addDaysToDate(newDate, 30));
                  }
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 font-medium"
                required
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-700">Inward Receiving Warehouse *</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-medium text-slate-900"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">Payment Due Date *</label>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  +30 Days by Default
                </span>
              </div>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 font-medium"
                required
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                <span className="text-slate-500 font-medium">Terms:</span>
                <button
                  type="button"
                  onClick={() => setDueDate(addDaysToDate(purchaseDate, 30))}
                  className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded transition-colors"
                >
                  30 Days (Default)
                </button>
                <button
                  type="button"
                  onClick={() => setDueDate(addDaysToDate(purchaseDate, 15))}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  15 Days
                </button>
                <button
                  type="button"
                  onClick={() => setDueDate(addDaysToDate(purchaseDate, 45))}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  45 Days
                </button>
                <button
                  type="button"
                  onClick={() => setDueDate(purchaseDate)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  Immediate
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Purchased Items (Inward Stock)</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[220px]">Product / Item</th>
                    <th className="py-2.5 px-2 text-center w-20">Qty</th>
                    <th className="py-2.5 px-2 text-center w-20">Unit</th>
                    <th className="py-2.5 px-2 text-right w-24">Purchase Price</th>
                    <th className="py-2.5 px-2 text-center w-20">GST %</th>
                    <th className="py-2.5 px-3 text-right w-28">Total (₹)</th>
                    <th className="py-2.5 px-2 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    const line = computedItems[idx];
                    const prod = products.find((p) => p.id === item.product_id);
                    return (
                      <tr key={idx}>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            {prod?.image_url && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={prod.image_url}
                                alt={prod.name}
                                className="w-7 h-7 rounded object-cover flex-shrink-0 border border-slate-200 shadow-2xs"
                              />
                            )}
                            <select
                              value={item.product_id}
                              onChange={(e) => handleProductChange(idx, e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded font-medium text-slate-900"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.sku})
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((it, i) =>
                                  i === idx ? { ...it, quantity: Number(e.target.value) || 1 } : it
                                )
                              )
                            }
                            className="w-full px-2 py-1.5 text-center font-mono font-bold border border-slate-300 rounded"
                          />
                        </td>
                        <td className="py-2 px-2 text-center text-slate-600">{item.unit}</td>
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((it, i) =>
                                  i === idx ? { ...it, rate: Number(e.target.value) || 0 } : it
                                )
                              )
                            }
                            className="w-full px-2 py-1.5 text-right font-mono border border-slate-300 rounded"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={item.gst_rate}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((it, i) =>
                                  i === idx ? { ...it, gst_rate: Number(e.target.value) } : it
                                )
                              )
                            }
                            className="w-full px-1.5 py-1.5 text-center font-mono border border-slate-300 rounded"
                          >
                            <option value={0}>0%</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18%</option>
                            <option value={28}>28%</option>
                          </select>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatINR(line ? line.total : 0)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Totals & Payments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Payment Paid at Inward (₹)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                    className="w-48 px-3 py-1.5 font-mono text-sm border border-slate-300 rounded-md font-semibold text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setPaidAmount(grandTotal)}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                  >
                    Full Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaidAmount(0)}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                  >
                    Unpaid
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Notes / GRN Verification</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-800"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Input GST (ITC):</span>
                <span>{formatINR(totalGst)}</span>
              </div>
              <div className="pt-2 border-t border-slate-300 flex justify-between text-sm font-bold text-slate-900 font-sans">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-800">{formatINR(grandTotal)}</span>
              </div>
              <div className="pt-2 border-t border-dashed border-slate-300 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Paid:</span>
                  <span className="text-emerald-700 font-bold">{formatINR(paidAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold">
                  <span>Payable Due:</span>
                  <span className={balanceDue > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                    {formatINR(balanceDue)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs"
            >
              Confirm Purchase & Receive Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
