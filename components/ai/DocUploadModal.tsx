'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  Trash2,
  Plus,
  ArrowRight,
  Package,
  Receipt,
  Boxes,
  Building2,
  Building,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { Warehouse, Supplier, Product } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface DocUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDocType?: 'purchase' | 'stock' | 'auto';
  warehouses: Warehouse[];
  suppliers: Supplier[];
  onSaveExtractedPurchase: (purchaseData: any) => void;
  onSaveExtractedStock: (stockItems: Partial<Product>[], warehouseId: string) => void;
}

export default function DocUploadModal({
  isOpen,
  onClose,
  defaultDocType = 'auto',
  warehouses,
  suppliers,
  onSaveExtractedPurchase,
  onSaveExtractedStock,
}: DocUploadModalProps) {
  const [docType, setDocType] = useState<'purchase' | 'stock' | 'auto'>(defaultDocType);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouses[0]?.id || 'wh-1');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.pdf')) {
      setScanError('Please upload a PDF document or an image (JPG, PNG, WebP).');
      return;
    }

    setScanError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFileBase64(result);
      if (file.type.startsWith('image/')) {
        setFilePreview(result);
      } else {
        setFilePreview(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleScanDocument = async () => {
    if (!fileBase64 && !selectedFile) {
      setScanError('Please select a PDF or JPG file to upload first.');
      return;
    }

    setIsScanning(true);
    setScanError(null);

    try {
      const res = await fetch('/api/ai/extract-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64,
          mimeType: selectedFile?.type || 'application/pdf',
          fileName: selectedFile?.name || 'document',
          docType,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to scan document.');
      }

      setExtractedData(json.data);
    } catch (err: any) {
      console.error('Scan failed:', err);
      setScanError(err.message || 'Error occurred while scanning document.');
    } finally {
      setIsScanning(false);
    }
  };

  const loadSampleDoc = (type: 'purchase' | 'stock') => {
    setDocType(type);
    setSelectedFile({
      name: type === 'purchase' ? 'Sample_Supplier_Bill_2026.jpg' : 'Warehouse_Stock_Catalog.pdf',
      size: 420000,
      type: type === 'purchase' ? 'image/jpeg' : 'application/pdf',
    } as any);

    // Provide a dummy transparent pixel base64 to trigger immediate parse
    const dummyBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    setFileBase64(dummyBase64);
    setFilePreview(null);
    setScanError(null);
    setExtractedData(null);
  };

  // -------------------------------------------------------------
  // PURCHASE BILL SAVE HANDLER
  // -------------------------------------------------------------
  const handleSavePurchase = () => {
    if (!extractedData || extractedData.type !== 'purchase') return;

    // Recalculate totals
    const items = (extractedData.items || []).map((it: any) => ({
      product_name: it.name || 'Unnamed Product',
      hsn_code: it.hsn || '',
      quantity: Number(it.quantity) || 1,
      unit: it.unit || 'Pcs',
      unit_price: Number(it.unit_price) || 0,
      discount_pct: 0,
      taxable_amount: (Number(it.quantity) || 1) * (Number(it.unit_price) || 0),
      gst_rate: Number(it.gst_rate) || 18,
      cgst_amount: Number(it.cgst_amount) || ((Number(it.quantity) || 1) * (Number(it.unit_price) || 0) * (Number(it.gst_rate) || 18)) / 200,
      sgst_amount: Number(it.sgst_amount) || ((Number(it.quantity) || 1) * (Number(it.unit_price) || 0) * (Number(it.gst_rate) || 18)) / 200,
      igst_amount: Number(it.igst_amount) || 0,
      total_amount:
        (Number(it.quantity) || 1) * (Number(it.unit_price) || 0) * (1 + (Number(it.gst_rate) || 18) / 100),
    }));

    const subtotal = items.reduce((sum: number, it: any) => sum + it.taxable_amount, 0);
    const taxTotal = items.reduce((sum: number, it: any) => sum + (it.cgst_amount + it.sgst_amount + it.igst_amount), 0);
    const grandTotal = subtotal + taxTotal;

    const matchedSupplier = suppliers.find(
      (s) => s.name.toLowerCase() === (extractedData.supplier_name || '').toLowerCase()
    );

    const purchasePayload = {
      purchase_number: extractedData.bill_number || `PB-SCAN-${Math.floor(1000 + Math.random() * 9000)}`,
      vendor_bill_number: extractedData.bill_number || '',
      supplier_id: matchedSupplier?.id || '',
      supplier_name: extractedData.supplier_name || 'Vendor Supplier',
      supplier_gstin: extractedData.supplier_gstin || '',
      supplier_address: extractedData.supplier_address || '',
      supplier_phone: extractedData.supplier_phone || '',
      date: extractedData.bill_date || new Date().toISOString().split('T')[0],
      due_date: extractedData.due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      items,
      subtotal,
      tax_amount: taxTotal,
      discount_amount: 0,
      total_amount: grandTotal,
      payment_status: 'Unpaid',
      amount_paid: 0,
      balance_due: grandTotal,
      notes: extractedData.notes || 'Extracted via AI PDF/JPG Scanner',
    };

    onSaveExtractedPurchase(purchasePayload);
    onClose();
  };

  // -------------------------------------------------------------
  // STOCK ITEMS SAVE HANDLER
  // -------------------------------------------------------------
  const handleSaveStock = () => {
    if (!extractedData || extractedData.type !== 'stock') return;

    const itemsToSave: Partial<Product>[] = (extractedData.items || []).map((it: any) => ({
      name: it.name || 'Stock Item',
      sku: it.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: it.category || 'General',
      hsn_code: it.hsn || '8471',
      unit: it.unit || 'Pcs',
      current_stock: Number(it.quantity) || 0,
      purchase_price: Number(it.cost_price) || 0,
      selling_price: Number(it.selling_price) || Math.round((Number(it.cost_price) || 0) * 1.3),
      min_stock_level: Number(it.min_stock_alert) || 5,
      tax_rate: 18,
    }));

    onSaveExtractedStock(itemsToSave, selectedWarehouseId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-xs max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                AI Document Scanner (PDF & JPG Upload)
              </h2>
              <p className="text-[11px] text-slate-500">
                Upload supplier purchase bills or inventory stock sheets in PDF or JPG format to auto-digitize into your system.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Document Type Selector & Sample Loaders */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-700 mr-1">Target Mode:</span>
              <button
                type="button"
                onClick={() => {
                  setDocType('auto');
                  setExtractedData(null);
                }}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  docType === 'auto'
                    ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Auto Detect
              </button>
              <button
                type="button"
                onClick={() => {
                  setDocType('purchase');
                  setExtractedData(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  docType === 'purchase'
                    ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-3 h-3" />
                <span>Purchase Bill (PDF/JPG)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDocType('stock');
                  setExtractedData(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  docType === 'stock'
                    ? 'bg-amber-600 text-white font-semibold shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Boxes className="w-3 h-3" />
                <span>Stock Sheet / Catalog</span>
              </button>
            </div>

            {/* Quick Demo Pre-fill */}
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-slate-400">Try sample:</span>
              <button
                type="button"
                onClick={() => loadSampleDoc('purchase')}
                className="text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2"
              >
                Purchase JPG
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => loadSampleDoc('stock')}
                className="text-amber-600 hover:text-amber-800 font-semibold underline underline-offset-2"
              >
                Stock PDF
              </button>
            </div>
          </div>

          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                : selectedFile
                ? 'border-emerald-300 bg-emerald-50/20'
                : 'border-slate-300 hover:border-slate-400 bg-white'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  {selectedFile.type?.includes('pdf') || selectedFile.name?.endsWith('.pdf') ? (
                    <FileText className="w-6 h-6" />
                  ) : (
                    <ImageIcon className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Document'}
                  </p>
                </div>
                <span className="text-[11px] text-indigo-600 font-semibold mt-1">Click to replace file</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2.5">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Click to browse or drag and drop your file here
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Supports Adobe PDF (.pdf), JPEG/JPG (.jpg, .jpeg), PNG (.png), and WebP
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium mt-1">
                  <span className="px-2 py-0.5 bg-slate-100 rounded">Vendor Purchase Bills</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded">Tax Invoices</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded">Item Price Sheets</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded">Inventory Audits</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Trigger Button */}
          {selectedFile && !extractedData && (
            <div className="flex justify-center">
              <button
                type="button"
                disabled={isScanning}
                onClick={handleScanDocument}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing & Extracting via AI Vision...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extract & Digitize Content</span>
                  </>
                )}
              </button>
            </div>
          )}

          {scanError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* EXTRACTED RESULT REVIEW ZONE                             */}
          {/* -------------------------------------------------------- */}
          {extractedData && (
            <div className="space-y-4 pt-2 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Extracted Data Preview ({extractedData.type === 'purchase' ? 'Purchase Bill' : 'Stock Items'})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setExtractedData(null);
                    setSelectedFile(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Scan another document</span>
                </button>
              </div>

              {/* 1. PURCHASE INVOICE PREVIEW */}
              {extractedData.type === 'purchase' && (
                <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Supplier / Vendor</span>
                      <input
                        type="text"
                        value={extractedData.supplier_name || ''}
                        onChange={(e) =>
                          setExtractedData({ ...extractedData, supplier_name: e.target.value })
                        }
                        className="w-full font-bold text-slate-900 mt-0.5 outline-hidden"
                      />
                      <span className="text-[10px] text-slate-500 block">GSTIN: {extractedData.supplier_gstin || 'N/A'}</span>
                    </div>

                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Bill Number</span>
                      <input
                        type="text"
                        value={extractedData.bill_number || ''}
                        onChange={(e) =>
                          setExtractedData({ ...extractedData, bill_number: e.target.value })
                        }
                        className="w-full font-bold text-slate-900 mt-0.5 outline-hidden"
                      />
                      <span className="text-[10px] text-slate-500 block">Date: {extractedData.bill_date || 'Today'}</span>
                    </div>

                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Extracted Amount</span>
                      <p className="text-base font-black text-emerald-700 mt-0.5">
                        {formatCurrency(extractedData.total_amount || 0)}
                      </p>
                      <span className="text-[10px] text-slate-500 block">Tax: {formatCurrency(extractedData.tax_amount || 0)}</span>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-800">Bill Line Items ({extractedData.items?.length || 0})</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
                            <th className="py-2 px-3">Item Description</th>
                            <th className="py-2 px-2">HSN</th>
                            <th className="py-2 px-2 text-right">Qty</th>
                            <th className="py-2 px-2">Unit</th>
                            <th className="py-2 px-2 text-right">Rate</th>
                            <th className="py-2 px-2 text-right">GST %</th>
                            <th className="py-2 px-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(extractedData.items || []).map((it: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-medium text-slate-900">{it.name}</td>
                              <td className="py-2 px-2 font-mono text-slate-500">{it.hsn || '-'}</td>
                              <td className="py-2 px-2 text-right font-semibold">{it.quantity}</td>
                              <td className="py-2 px-2 text-slate-500">{it.unit || 'Pcs'}</td>
                              <td className="py-2 px-2 text-right">{formatCurrency(it.unit_price)}</td>
                              <td className="py-2 px-2 text-right">{it.gst_rate}%</td>
                              <td className="py-2 px-3 text-right font-bold text-slate-900">
                                {formatCurrency(it.total_amount || it.quantity * it.unit_price * (1 + (it.gst_rate || 18) / 100))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Save Button for Purchase */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSavePurchase}
                      className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save as Purchase Invoice & Stock In</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. STOCK ITEMS / CATALOG PREVIEW */}
              {extractedData.type === 'stock' && (
                <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Stock Batch Summary</span>
                      <p className="font-bold text-slate-900 text-xs mt-0.5">
                        {extractedData.catalog_title || 'Stock Items List'} • {extractedData.items?.length || 0} unique items
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700">Assign to Warehouse:</span>
                      <select
                        value={selectedWarehouseId}
                        onChange={(e) => setSelectedWarehouseId(e.target.value)}
                        className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white font-medium text-slate-800"
                      >
                        {warehouses.map((wh) => (
                          <option key={wh.id} value={wh.id}>
                            {wh.name} ({wh.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
                          <th className="py-2 px-3">Item Name</th>
                          <th className="py-2 px-2">SKU Code</th>
                          <th className="py-2 px-2">Category</th>
                          <th className="py-2 px-2 text-right">Stock Qty</th>
                          <th className="py-2 px-2">Unit</th>
                          <th className="py-2 px-2 text-right">Cost Price</th>
                          <th className="py-2 px-2 text-right">Selling MRP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(extractedData.items || []).map((it: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-medium text-slate-900">{it.name}</td>
                            <td className="py-2 px-2 font-mono text-slate-500">{it.sku}</td>
                            <td className="py-2 px-2">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                                {it.category || 'General'}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-right font-bold text-amber-700">{it.quantity}</td>
                            <td className="py-2 px-2 text-slate-500">{it.unit || 'Pcs'}</td>
                            <td className="py-2 px-2 text-right">{formatCurrency(it.cost_price || 0)}</td>
                            <td className="py-2 px-2 text-right font-semibold text-emerald-700">
                              {formatCurrency(it.selling_price || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Save Button for Stock */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSaveStock}
                      className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-sm"
                    >
                      <Boxes className="w-4 h-4" />
                      <span>Import All Items into Inventory</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>Supports scanned receipts, supplier GST tax invoices, and multi-line item catalogs</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
