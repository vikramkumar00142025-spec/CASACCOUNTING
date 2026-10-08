'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Truck, AlertTriangle } from 'lucide-react';
import { Customer, Product, Warehouse, DeliveryChallan, DeliveryChallanItem } from '@/types';
import { getTodayDateString, generateDocNumber } from '@/lib/utils';

interface CreateChallanModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  products: Product[];
  warehouses: Warehouse[];
  challanPrefix: string;
  onSaveChallan: (challanData: Omit<DeliveryChallan, 'id' | 'company_id' | 'created_by' | 'created_at'>) => { success: boolean };
}

export default function CreateChallanModal({
  isOpen,
  onClose,
  customers,
  products,
  warehouses,
  challanPrefix,
  onSaveChallan,
}: CreateChallanModalProps) {
  const [customerId, setCustomerId] = useState<string>(customers[0]?.id || '');
  const [challanDate, setChallanDate] = useState<string>(() => getTodayDateString());
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [transporter, setTransporter] = useState<string>('V-Trans Express Logistics');
  const [vehicleNumber, setVehicleNumber] = useState<string>('KA-05-MM-1234');
  const [ewayBillNumber, setEwayBillNumber] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>(warehouses[0]?.id || 'wh-1');
  const [remarks, setRemarks] = useState<string>('Goods dispatched on approval / delivery trial. Goods remain company property until invoiced.');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [items, setItems] = useState<
    {
      product_id: string;
      product_name: string;
      hsn_code: string;
      unit: string;
      quantity: number;
      rate: number;
      notes: string;
    }[]
  >([
    {
      product_id: products[0]?.id || '',
      product_name: products[0]?.name || '',
      hsn_code: products[0]?.hsn_sac_code || '84715000',
      unit: products[0]?.unit || 'Units',
      quantity: 1,
      rate: products[0]?.selling_price || 1000,
      notes: 'Initial test shipment',
    },
  ]);

  if (!isOpen) return null;

  const currentCustomer = customers.find((c) => c.id === customerId);

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
            }
          : item
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
        hsn_code: first?.hsn_sac_code || '84715000',
        unit: first?.unit || 'Units',
        quantity: 1,
        rate: first?.selling_price || 1000,
        notes: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !currentCustomer) {
      setErrorMessage('Please select a valid customer.');
      return;
    }

    const nextChallanNumber = generateDocNumber(challanPrefix);
    const finalAddress = deliveryAddress.trim() || currentCustomer.address + ', ' + currentCustomer.city;

    const challanItems: DeliveryChallanItem[] = items.map((item, idx) => ({
      id: 'dci-' + idx + '-' + nextChallanNumber,
      product_id: item.product_id,
      product_name: item.product_name,
      hsn_code: item.hsn_code,
      unit: item.unit,
      quantity: item.quantity,
      rate: item.rate,
      notes: item.notes,
    }));

    onSaveChallan({
      challan_number: nextChallanNumber,
      challan_date: challanDate,
      customer_id: currentCustomer.id,
      customer_name: currentCustomer.name,
      delivery_address: finalAddress,
      transporter,
      vehicle_number: vehicleNumber,
      eway_bill_number: ewayBillNumber,
      items: challanItems,
      status: 'Pending',
      remarks,
      warehouse_id: warehouseId,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Truck className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Create Delivery Challan</h2>
              <p className="text-xs text-slate-500">Generate dispatch note for delivery trial, job work or exhibition</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Parties & Transport */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Customer / Consignee *</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-medium text-slate-900"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company_name ? `(${c.company_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Challan Date *</label>
              <input
                type="date"
                value={challanDate}
                onChange={(e) => setChallanDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Dispatch Depot *</label>
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

            <div className="sm:col-span-3 space-y-1">
              <label className="font-semibold text-slate-700">Delivery Address (Leave blank for customer registered address)</label>
              <input
                type="text"
                placeholder={currentCustomer?.address || 'Site delivery address'}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Transporter Name</label>
              <input
                type="text"
                value={transporter}
                onChange={(e) => setTransporter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Vehicle Number</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 uppercase font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">e-Way Bill Number (Optional)</label>
              <input
                type="text"
                placeholder="12 digits e-Way Bill"
                value={ewayBillNumber}
                onChange={(e) => setEwayBillNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 font-mono"
              />
            </div>
          </div>

          {/* Section 2: Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Products for Delivery</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[200px]">Item Description</th>
                    <th className="py-2.5 px-2 text-center w-24">HSN/SAC</th>
                    <th className="py-2.5 px-2 text-center w-20">Quantity</th>
                    <th className="py-2.5 px-2 text-center w-20">Unit</th>
                    <th className="py-2.5 px-3">Serial Numbers / Notes</th>
                    <th className="py-2.5 px-2 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
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
                      <td className="py-2 px-2 text-center font-mono text-slate-600">{item.hsn_code}</td>
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
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          placeholder="Batch no, serial numbers..."
                          value={item.notes}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((it, i) =>
                                i === idx ? { ...it, notes: e.target.value } : it
                              )
                            )
                          }
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-slate-800"
                        />
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

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Remarks / Condition of Goods</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-800"
            />
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
              Generate Delivery Challan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
