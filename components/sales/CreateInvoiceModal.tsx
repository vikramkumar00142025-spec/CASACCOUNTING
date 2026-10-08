'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Receipt,
  UserPlus,
  AlertTriangle,
  Building,
} from 'lucide-react';
import {
  CompanyProfile,
  Customer,
  Product,
  Warehouse,
  SalesInvoiceItem,
  SalesInvoice,
} from '@/types';
import { calculateItemTax, formatINR, isInterstate } from '@/lib/gst-calculator';
import { getTodayDateString, getFutureDateString, addDaysToDate, generateDocNumber } from '@/lib/utils';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyProfile;
  customers: Customer[];
  products: Product[];
  warehouses: Warehouse[];
  onSaveInvoice: (invoiceData: Omit<SalesInvoice, 'id' | 'company_id' | 'created_by' | 'created_at'>) => { success: boolean; error?: string };
  onQuickAddCustomer: (customerData: Partial<Customer>) => void;
}

interface DraftItem {
  product_id: string;
  product_name: string;
  hsn_code: string;
  unit: string;
  quantity: number;
  rate: number;
  discount_percent: number;
  gst_rate: number;
}

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  company,
  customers,
  products,
  warehouses,
  onSaveInvoice,
  onQuickAddCustomer,
}: CreateInvoiceModalProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => customers[0]?.id || '');
  const [invoiceDate, setInvoiceDate] = useState<string>(() => getTodayDateString());
  const [dueDate, setDueDate] = useState<string>(() => getFutureDateString(30));
  const [warehouseId, setWarehouseId] = useState<string>(warehouses[0]?.id || 'wh-1');
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('All equipment warranted by OEM for 12 months.');
  const [terms, setTerms] = useState<string>(
    '1. Payment due within 30 days.\n2. Goods once sold will be accepted back only in original sealed packaging.\n3. Subject to jurisdiction of Bengaluru.'
  );

  // Quick Customer Form State
  const [showQuickCust, setShowQuickCust] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickState, setQuickState] = useState(company.state);
  const [quickGstin, setQuickGstin] = useState('');

  // Items State
  const [items, setItems] = useState<DraftItem[]>([
    {
      product_id: products[0]?.id || '',
      product_name: products[0]?.name || '',
      hsn_code: products[0]?.hsn_sac_code || '84715000',
      unit: products[0]?.unit || 'Units',
      quantity: 1,
      rate: products[0]?.selling_price || 1000,
      discount_percent: 0,
      gst_rate: products[0]?.gst_rate || company.default_gst_rate,
    },
  ]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);
  const isInterState = isInterstate(company.state, currentCustomer?.state || company.state);

  // Compute calculated line items
  const computedItems: SalesInvoiceItem[] = items.map((item, idx) => {
    const calc = calculateItemTax({
      quantity: item.quantity,
      rate: item.rate,
      discountPercent: item.discount_percent,
      gstRate: item.gst_rate,
      isInterState,
    });

    return {
      id: 'draft-item-' + idx,
      product_id: item.product_id,
      product_name: item.product_name,
      hsn_code: item.hsn_code,
      unit: item.unit,
      quantity: item.quantity,
      rate: item.rate,
      discount_percent: item.discount_percent,
      discount_amount: calc.discountAmount,
      taxable_amount: calc.taxableAmount,
      gst_rate: item.gst_rate,
      cgst_amount: calc.cgstAmount,
      sgst_amount: calc.sgstAmount,
      igst_amount: calc.igstAmount,
      total: calc.total,
    };
  });

  const subtotal = computedItems.reduce((acc, i) => acc + i.quantity * i.rate, 0);
  const totalDiscount = computedItems.reduce((acc, i) => acc + i.discount_amount, 0);
  const taxableAmount = computedItems.reduce((acc, i) => acc + i.taxable_amount, 0);
  const totalCgst = computedItems.reduce((acc, i) => acc + i.cgst_amount, 0);
  const totalSgst = computedItems.reduce((acc, i) => acc + i.sgst_amount, 0);
  const totalIgst = computedItems.reduce((acc, i) => acc + i.igst_amount, 0);
  const grandTotal = Number((taxableAmount + totalCgst + totalSgst + totalIgst).toFixed(2));
  const balanceDue = Math.max(0, Number((grandTotal - paidAmount).toFixed(2)));

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              product_id: prod.id,
              product_name: prod.name,
              hsn_code: prod.hsn_sac_code,
              unit: prod.unit,
              rate: prod.selling_price,
              gst_rate: prod.gst_rate,
            }
          : item
      )
    );
  };

  const handleAddItem = () => {
    const firstProd = products[0];
    setItems((prev) => [
      ...prev,
      {
        product_id: firstProd?.id || '',
        product_name: firstProd?.name || 'Item',
        hsn_code: firstProd?.hsn_sac_code || '84715000',
        unit: firstProd?.unit || 'Units',
        quantity: 1,
        rate: firstProd?.selling_price || 1000,
        discount_percent: 0,
        gst_rate: firstProd?.gst_rate || company.default_gst_rate,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;
    onQuickAddCustomer({
      name: quickName.trim(),
      phone: quickPhone.trim() || '+91 98000 00000',
      email: quickEmail.trim() || `${quickName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      state: quickState,
      city: 'Commercial Hub',
      address: 'Main Office Road',
      pin_code: '560001',
      gstin: quickGstin.trim(),
    });
    setShowQuickCust(false);
    setQuickName('');
    setQuickPhone('');
    setQuickGstin('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCustomerId || !currentCustomer) {
      setErrorMessage('Please select or create a customer.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Please add at least one line item.');
      return;
    }

    const nextInvoiceNumber = generateDocNumber(company.invoice_prefix);

    const paymentStatus =
      paidAmount >= grandTotal
        ? 'Paid'
        : paidAmount > 0
        ? 'Partially Paid'
        : 'Confirmed';

    const result = onSaveInvoice({
      invoice_number: nextInvoiceNumber,
      invoice_date: invoiceDate,
      due_date: dueDate,
      customer_id: currentCustomer.id,
      customer_name: currentCustomer.name,
      customer_gstin: currentCustomer.gstin,
      customer_state: currentCustomer.state,
      customer_phone: currentCustomer.phone,
      billing_address: currentCustomer.address + ', ' + currentCustomer.city + ' - ' + currentCustomer.pin_code,
      shipping_address: currentCustomer.address + ', ' + currentCustomer.city + ' - ' + currentCustomer.pin_code,
      items: computedItems,
      subtotal,
      total_discount: totalDiscount,
      taxable_amount: taxableAmount,
      total_cgst: totalCgst,
      total_sgst: totalSgst,
      total_igst: totalIgst,
      round_off: 0,
      grand_total: grandTotal,
      paid_amount: paidAmount,
      balance_due: balanceDue,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      notes,
      terms_and_conditions: terms,
      warehouse_id: warehouseId,
    });

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to create sales invoice.');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Generate GST Sales Tax Invoice</h2>
              <p className="text-xs text-slate-500">
                Place of Supply: <strong className="text-slate-800">{currentCustomer?.state || company.state}</strong>{' '}
                ({isInterState ? 'Inter-State · IGST Applicable' : 'Intra-State · CGST + SGST Applicable'})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Customer & Invoice Meta */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            {/* Customer Picker */}
            <div className="md:col-span-2 space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">Customer / Billed Party *</label>
                <button
                  type="button"
                  onClick={() => setShowQuickCust(!showQuickCust)}
                  className="text-blue-600 hover:text-blue-800 text-[11px] font-medium flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ Quick Add</span>
                </button>
              </div>

              {!showQuickCust ? (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-medium text-slate-900 outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company_name ? `(${c.company_name})` : ''} - {c.state}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-white border border-blue-200 rounded-lg space-y-2">
                  <input
                    type="text"
                    placeholder="Customer / Company Name"
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Phone"
                      value={quickPhone}
                      onChange={(e) => setQuickPhone(e.target.value)}
                      className="px-2 py-1 text-xs border border-slate-300 rounded"
                    />
                    <input
                      type="text"
                      placeholder="GSTIN (Optional)"
                      value={quickGstin}
                      onChange={(e) => setQuickGstin(e.target.value)}
                      className="px-2 py-1 text-xs border border-slate-300 rounded uppercase font-mono"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowQuickCust(false)}
                      className="px-2 py-1 text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateCustomer}
                      className="px-3 py-1 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
                    >
                      Save Customer
                    </button>
                  </div>
                </div>
              )}

              {currentCustomer && (
                <p className="text-[11px] text-slate-500 truncate">
                  GSTIN: {currentCustomer.gstin || 'Unregistered / Consumer'} · State: {currentCustomer.state}
                </p>
              )}
            </div>

            {/* Invoice Date */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Invoice Date *</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setInvoiceDate(newDate);
                  if (newDate) {
                    setDueDate(addDaysToDate(newDate, 30));
                  }
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 outline-hidden font-medium"
                required
              />
            </div>

            {/* Due Date (30 Days Default) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">Payment Due Date *</label>
                <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  +30 Days by Default
                </span>
              </div>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 outline-hidden font-medium"
                required
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                <span className="text-slate-500 font-medium">Terms:</span>
                <button
                  type="button"
                  onClick={() => setDueDate(addDaysToDate(invoiceDate, 30))}
                  className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded transition-colors"
                >
                  30 Days (Default)
                </button>
                <button
                  type="button"
                  onClick={() => setDueDate(addDaysToDate(invoiceDate, 15))}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  15 Days
                </button>
                <button
                  type="button"
                  onClick={() => setDueDate(addDaysToDate(invoiceDate, 45))}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  45 Days
                </button>
                <button
                  type="button"
                  onClick={() => setDueDate(invoiceDate)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  Due on Receipt
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Items Table Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Itemized Products & Taxable Charges
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[220px]">Product / Item</th>
                    <th className="py-2.5 px-2 text-center w-24">HSN/SAC</th>
                    <th className="py-2.5 px-2 text-center w-20">Stock</th>
                    <th className="py-2.5 px-2 text-center w-20">Qty</th>
                    <th className="py-2.5 px-2 text-right w-24">Rate (₹)</th>
                    <th className="py-2.5 px-2 text-right w-20">Disc %</th>
                    <th className="py-2.5 px-2 text-center w-20">GST %</th>
                    <th className="py-2.5 px-3 text-right w-28">Total (₹)</th>
                    <th className="py-2.5 px-2 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    const prod = products.find((p) => p.id === item.product_id);
                    const isStockLow = prod && prod.current_stock < item.quantity;
                    const line = computedItems[idx];

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        {/* Product Select */}
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

                        {/* HSN Code */}
                        <td className="py-2 px-2 text-center font-mono text-slate-600">
                          {item.hsn_code}
                        </td>

                        {/* Available Stock Indicator */}
                        <td className="py-2 px-2 text-center font-mono">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              isStockLow
                                ? 'bg-red-100 text-red-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {prod?.current_stock ?? 0}
                          </span>
                        </td>

                        {/* Quantity */}
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
                            className="w-full px-2 py-1.5 text-center font-mono border border-slate-300 rounded font-bold"
                          />
                        </td>

                        {/* Rate */}
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

                        {/* Discount % */}
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount_percent}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((it, i) =>
                                  i === idx ? { ...it, discount_percent: Number(e.target.value) || 0 } : it
                                )
                              )
                            }
                            className="w-full px-2 py-1.5 text-right font-mono border border-slate-300 rounded"
                          />
                        </td>

                        {/* GST Rate */}
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

                        {/* Line Total */}
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatINR(line ? line.total : 0)}
                        </td>

                        {/* Delete Row */}
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

          {/* Section 3: Payment, Warehouse & Summary Calculation */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
            {/* Left Controls */}
            <div className="md:col-span-7 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Dispatch Warehouse</label>
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

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-medium text-slate-900"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Card">Card / POS</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Advance / Immediate Paid Amount (₹)</label>
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
                    Full Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaidAmount(0)}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                  >
                    Credit (0)
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-slate-800"
                />
              </div>
            </div>

            {/* Right Financial Breakdown */}
            <div className="md:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Gross):</span>
                <span className="font-semibold text-slate-900">{formatINR(subtotal)}</span>
              </div>

              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Total Discount:</span>
                  <span>-{formatINR(totalDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Taxable Amount:</span>
                <span className="font-bold text-slate-900">{formatINR(taxableAmount)}</span>
              </div>

              {isInterState ? (
                <div className="flex justify-between text-slate-600">
                  <span>IGST (Inter-State):</span>
                  <span>{formatINR(totalIgst)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST:</span>
                    <span>{formatINR(totalCgst)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST:</span>
                    <span>{formatINR(totalSgst)}</span>
                  </div>
                </>
              )}

              <div className="pt-2 border-t border-slate-300 flex justify-between text-base font-bold text-slate-900 font-sans">
                <span>Grand Total:</span>
                <span className="font-mono text-blue-900">{formatINR(grandTotal)}</span>
              </div>

              <div className="pt-2 border-t border-dashed border-slate-300 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Paid Now:</span>
                  <span className="font-bold text-emerald-700">{formatINR(paidAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold">
                  <span>Balance Due:</span>
                  <span className={balanceDue > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                    {formatINR(balanceDue)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs"
            >
              Generate & Confirm Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
