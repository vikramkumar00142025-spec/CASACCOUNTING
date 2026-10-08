'use client';

import React from 'react';
import {
  Printer,
  X,
  FileCheck,
  Receipt,
  Truck,
  Ban,
  ArrowRight,
} from 'lucide-react';
import { DeliveryChallan, CompanyProfile } from '@/types';
import ChallanPrintTemplate from './ChallanPrintTemplate';

interface ChallanDetailModalProps {
  challan: DeliveryChallan | null;
  company: CompanyProfile;
  onClose: () => void;
  onConvertToInvoice: (challanId: string) => void;
}

export default function ChallanDetailModal({
  challan,
  company,
  onClose,
  onConvertToInvoice,
}: ChallanDetailModalProps) {
  if (!challan) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print-hide">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900 text-sm">{challan.challan_number}</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                challan.status === 'Converted'
                  ? 'bg-emerald-100 text-emerald-800'
                  : challan.status === 'Cancelled'
                  ? 'bg-slate-200 text-slate-600 line-through'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {challan.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {challan.status === 'Pending' && (
              <button
                onClick={() => onConvertToInvoice(challan.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-xs"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Convert to Tax Invoice</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Challan</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100">
          <ChallanPrintTemplate challan={challan} company={company} />
        </div>
      </div>
    </div>
  );
}
