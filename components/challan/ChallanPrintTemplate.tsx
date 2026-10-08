'use client';

import React from 'react';
import { DeliveryChallan, CompanyProfile } from '@/types';

interface ChallanPrintTemplateProps {
  challan: DeliveryChallan;
  company: CompanyProfile;
}

export default function ChallanPrintTemplate({
  challan,
  company,
}: ChallanPrintTemplateProps) {
  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-white text-slate-900 text-xs printable-document shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-start justify-between pb-6 border-b-2 border-slate-900">
        <div>
          <span className="inline-block px-2.5 py-0.5 mb-2 text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white rounded-xs">
            DELIVERY CHALLAN
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">{company.name}</h1>
          <p className="text-slate-600 mt-1 max-w-sm">{company.address}, {company.city} - {company.pin_code}, {company.state}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-slate-600 font-mono text-[11px]">
            <span><strong>GSTIN:</strong> {company.gstin}</span>
            <span><strong>State Code:</strong> {company.state_code}</span>
          </div>
          <p className="text-slate-500 mt-1">Ph: {company.phone} · Email: {company.email}</p>
        </div>

        <div className="text-right">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg inline-block text-left min-w-[200px]">
            <div className="text-slate-500 text-[11px]">Challan Number:</div>
            <div className="text-base font-bold font-mono text-slate-900">{challan.challan_number}</div>
            <div className="mt-2 text-slate-500 text-[11px]">Challan Date:</div>
            <div className="font-semibold text-slate-800">{challan.challan_date}</div>
            <div className="mt-1 text-slate-500 text-[11px]">Status:</div>
            <div className="font-bold text-blue-700">{challan.status}</div>
          </div>
        </div>
      </div>

      {/* Recipient & Transport Details */}
      <div className="grid grid-cols-2 gap-6 py-4 border-b border-slate-200">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Consignee / Customer Details:</h3>
          <p className="text-sm font-bold text-slate-900">{challan.customer_name}</p>
          <p className="text-slate-600 mt-1 leading-relaxed">{challan.delivery_address}</p>
          {challan.reference_invoice_number && (
            <p className="mt-2 text-slate-700 font-semibold font-mono text-[11px]">
              Reference Invoice: {challan.reference_invoice_number}
            </p>
          )}
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-[11px]">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Dispatch & Transport Details:</h3>
          <p><strong>Transporter:</strong> {challan.transporter || 'Self / Company Vehicle'}</p>
          <p><strong>Vehicle Number:</strong> {challan.vehicle_number || 'N/A'}</p>
          <p><strong>e-Way Bill Number:</strong> {challan.eway_bill_number || 'Under ₹50,000 / Exempt'}</p>
          <p><strong>Place of Delivery:</strong> {challan.delivery_address}</p>
        </div>
      </div>

      {/* Item Table */}
      <table className="w-full my-4 border-collapse text-left">
        <thead>
          <tr className="bg-slate-100 text-slate-700 font-bold border-y border-slate-300">
            <th className="py-2.5 px-3 w-8 text-center">#</th>
            <th className="py-2.5 px-3">Item Description</th>
            <th className="py-2.5 px-3 text-center">HSN/SAC</th>
            <th className="py-2.5 px-3 text-center">Quantity</th>
            <th className="py-2.5 px-3 text-center">Unit</th>
            <th className="py-2.5 px-3">Remarks / Serial Numbers</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {challan.items.map((item, idx) => (
            <tr key={idx} className="hover:bg-slate-50/50">
              <td className="py-3 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
              <td className="py-3 px-3 font-semibold text-slate-900">{item.product_name}</td>
              <td className="py-3 px-3 text-center font-mono text-slate-600">{item.hsn_code}</td>
              <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 text-sm">{item.quantity}</td>
              <td className="py-3 px-3 text-center text-slate-600">{item.unit}</td>
              <td className="py-3 px-3 text-slate-500">{item.notes || 'Dispatched in good condition'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Remarks */}
      {challan.remarks && (
        <div className="py-3 border-t border-slate-200">
          <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Instructions & Notes:</h4>
          <p className="text-slate-600 mt-1">{challan.remarks}</p>
        </div>
      )}

      {/* Dual Signatures */}
      <div className="grid grid-cols-2 gap-8 pt-10 border-t border-slate-200">
        <div>
          <div className="h-16 border-b border-slate-300 flex items-end pb-1">
            <span className="text-[11px] text-slate-500">{challan.received_by || 'Receiver Signature & Company Stamp'}</span>
          </div>
          <p className="text-[11px] font-bold text-slate-800 mt-1">Received by (Consignee)</p>
          <p className="text-[10px] text-slate-400">Goods received in sound condition without shortage</p>
        </div>

        <div className="text-right">
          <div className="h-16 border-b border-slate-300 flex items-end justify-end pb-1">
            <span className="font-serif italic text-slate-600 text-xs">For {company.legal_name}</span>
          </div>
          <p className="text-[11px] font-bold text-slate-800 mt-1">Authorised Signatory</p>
          <p className="text-[10px] text-slate-400">Warehouse Dispatch Officer</p>
        </div>
      </div>
    </div>
  );
}
