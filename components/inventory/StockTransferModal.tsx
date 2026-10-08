'use client';

import React, { useState } from 'react';
import { X, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { Product, Warehouse } from '@/types';

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  warehouses: Warehouse[];
  onConfirmTransfer: (params: {
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    notes?: string;
  }) => { success: boolean; error?: string };
}

export default function StockTransferModal({
  isOpen,
  onClose,
  product,
  warehouses,
  onConfirmTransfer,
}: StockTransferModalProps) {
  const [fromWarehouseId, setFromWarehouseId] = useState(product?.warehouse_id || warehouses[0]?.id || 'wh-1');
  const [toWarehouseId, setToWarehouseId] = useState(warehouses[1]?.id || warehouses[0]?.id || 'wh-2');
  const [quantity, setQuantity] = useState<number>(5);
  const [notes, setNotes] = useState('Stock replenishment for regional depot');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (fromWarehouseId === toWarehouseId) {
      setError('Origin and destination warehouses must be different.');
      return;
    }

    if (quantity <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    const res = onConfirmTransfer({
      productId: product.id,
      fromWarehouseId,
      toWarehouseId,
      quantity,
      notes,
    });

    if (!res.success) {
      setError(res.error || 'Failed to transfer stock.');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Inter-Warehouse Stock Transfer</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="font-semibold text-slate-900 text-sm block">{product.name}</span>
            <p className="font-mono text-slate-500 mt-0.5">SKU: {product.sku} · Available Total: <strong className="text-slate-900 font-bold">{product.current_stock} {product.unit}</strong></p>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Source Warehouse (Transfer From)</label>
            <select
              value={fromWarehouseId}
              onChange={(e) => setFromWarehouseId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded bg-white text-slate-900"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Destination Warehouse (Transfer To)</label>
            <select
              value={toWarehouseId}
              onChange={(e) => setToWarehouseId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded bg-white text-slate-900"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Transfer Quantity ({product.unit})</label>
            <input
              type="number"
              min="1"
              max={product.current_stock}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="w-full px-3 py-1.5 font-mono text-base font-bold border border-slate-300 rounded text-slate-900"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Transfer Reason / Dispatch Docket #</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-800"
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
              Confirm Inter-Depot Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
