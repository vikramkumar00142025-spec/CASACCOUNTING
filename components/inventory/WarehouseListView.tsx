'use client';

import React, { useState } from 'react';
import { Warehouse as WarehouseIcon, Plus, MapPin, Phone, User, CheckCircle2 } from 'lucide-react';
import { Warehouse, Product } from '@/types';

interface WarehouseListViewProps {
  warehouses: Warehouse[];
  products: Product[];
  onSaveWarehouse: (wh: Partial<Warehouse> & { name: string; code: string; address: string }) => void;
}

export default function WarehouseListView({
  warehouses,
  products,
  onSaveWarehouse,
}: WarehouseListViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    onSaveWarehouse({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      address: address.trim(),
      contact_person: contactPerson.trim(),
      phone: phone.trim(),
    });

    setShowModal(false);
    setName('');
    setCode('');
    setAddress('');
    setContactPerson('');
    setPhone('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Multi-Warehouse Depots</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage regional storage hubs, distribution facilities and stock allocations</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Warehouse Depot</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {warehouses.map((wh) => {
          const warehouseProducts = products.filter((p) => p.warehouse_id === wh.id);
          const totalUnits = warehouseProducts.reduce((sum, p) => sum + p.current_stock, 0);

          return (
            <div
              key={wh.id}
              className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-bold">
                    {wh.code}
                  </span>
                  {wh.is_default && (
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      Primary Depot
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-2">{wh.name}</h3>
                <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{wh.address}</span>
                  </div>
                  {wh.contact_person && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{wh.contact_person}</span>
                    </div>
                  )}
                  {wh.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{wh.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Allocated SKUs:</span>
                <span className="font-bold text-slate-900">{warehouseProducts.length} items</span>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Add New Warehouse</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Depot Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Pune Regional Logistics Hub"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900 font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Depot Code *</label>
                <input
                  type="text"
                  placeholder="e.g. PRH-04"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900 uppercase font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Complete Address *</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                  Save Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
