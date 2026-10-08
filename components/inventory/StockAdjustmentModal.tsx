'use client';

import React, { useState } from 'react';
import { X, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { Product, Warehouse } from '@/types';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  warehouses: Warehouse[];
  onConfirmAdjustment: (params: {
    productId: string;
    warehouseId: string;
    transactionType: 'Stock Adjustment' | 'Damaged Stock';
    quantity: number;
    referenceType: string;
    referenceNumber: string;
    notes: string;
  }) => { success: boolean; error?: string };
}

export default function StockAdjustmentModal({
  isOpen,
  onClose,
  product,
  warehouses,
  onConfirmAdjustment,
}: StockAdjustmentModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<'Add' | 'Subtract'>('Add');
  const [reasonType, setReasonType] = useState<'Stock Adjustment' | 'Damaged Stock'>('Stock Adjustment');
  const [quantity, setQuantity] = useState<number>(1);
  const [warehouseId, setWarehouseId] = useState(product?.warehouse_id || warehouses[0]?.id || 'wh-1');
  const [notes, setNotes] = useState('Physical audit count adjustment');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const currentStock = product.current_stock;
  const delta = adjustmentType === 'Add' ? quantity : -quantity;
  const projectedStock = currentStock + delta;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (quantity <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    const res = onConfirmAdjustment({
      productId: product.id,
      warehouseId,
      transactionType: reasonType,
      quantity: delta,
      referenceType: 'Manual Adjustment',
      referenceNumber: 'ADJ-' + Date.now().toString().slice(-4),
      notes: notes.trim(),
    });

    if (!res.success) {
      setError(res.error || 'Failed to adjust stock.');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Adjust Stock / Audit Variance</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="font-semibold text-slate-900 text-sm block">{product.name}</span>
            <p className="font-mono text-slate-500">SKU: {product.sku} · Current Stock: <strong className="text-slate-900 font-bold">{currentStock} {product.unit}</strong></p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Adjustment Action</label>
              <div className="flex rounded-md border border-slate-300 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('Add')}
                  className={`flex-1 py-1.5 font-bold transition-colors ${
                    adjustmentType === 'Add' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  + Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('Subtract')}
                  className={`flex-1 py-1.5 font-bold transition-colors ${
                    adjustmentType === 'Subtract' ? 'bg-red-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  - Deduct Stock
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Classification</label>
              <select
                value={reasonType}
                onChange={(e) => setReasonType(e.target.value as any)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
              >
                <option value="Stock Adjustment">Stock Audit Variance</option>
                <option value="Damaged Stock">Damaged / Expired</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Quantity to Adjust ({product.unit})</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-3 py-1.5 font-mono text-base font-bold border border-slate-300 rounded text-slate-900"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Warehouse Depot</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-2 py-2 border border-slate-300 rounded bg-white text-slate-900"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-100 rounded-lg flex items-center justify-between text-xs font-mono">
            <span>Projected New Stock:</span>
            <span className={`font-bold text-sm ${projectedStock < 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {projectedStock} {product.unit}
            </span>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Reason / Audit Narration *</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-800"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800"
            >
              Apply Stock Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
