'use client';

import React from 'react';
import { SalesInvoice, CompanyProfile } from '@/types';
import { formatINR, amountInWords } from '@/lib/gst-calculator';
import { QRCodeSVG } from 'qrcode.react';
import { buildUPIUrl } from '@/lib/upi';

interface InvoicePrintTemplateProps {
  invoice: SalesInvoice;
  company: CompanyProfile;
  template: 'Modern' | 'Professional' | 'Minimal' | 'Thermal';
}

export default function InvoicePrintTemplate({
  invoice,
  company,
  template,
}: InvoicePrintTemplateProps) {
  const isInterState = invoice.total_igst > 0;
  const upiId = company.upi_id || 'zenithapex@hdfcbank';
  const upiPayee = company.upi_payee_name || company.name;
  const payableAmount = invoice.balance_due > 0 ? invoice.balance_due : invoice.grand_total;
  const upiUrl = buildUPIUrl({
    upiId,
    payeeName: upiPayee,
    amount: payableAmount,
    transactionRef: invoice.invoice_number,
    transactionNote: `Invoice ${invoice.invoice_number}`,
  });

  // Thermal POS Slip Template (compact receipt)
  if (template === 'Thermal') {
    return (
      <div className="w-[80mm] mx-auto p-4 bg-white text-black font-mono text-[11px] leading-tight printable-document border border-slate-300">
        <div className="text-center pb-2 border-b border-dashed border-black">
          <h2 className="text-sm font-bold uppercase">{company.name}</h2>
          <p className="text-[10px]">{company.address}</p>
          <p className="text-[10px]">GSTIN: {company.gstin}</p>
          <p className="text-[10px]">Ph: {company.phone}</p>
        </div>

        <div className="py-2 border-b border-dashed border-black space-y-0.5">
          <div className="flex justify-between">
            <span>INV NO:</span>
            <span className="font-bold">{invoice.invoice_number}</span>
          </div>
          <div className="flex justify-between">
            <span>DATE:</span>
            <span>{invoice.invoice_date}</span>
          </div>
          <div className="flex justify-between">
            <span>CUSTOMER:</span>
            <span className="truncate max-w-[140px]">{invoice.customer_name}</span>
          </div>
        </div>

        <table className="w-full my-2 text-left">
          <thead>
            <tr className="border-b border-black text-[10px]">
              <th className="py-1">ITEM</th>
              <th className="py-1 text-center">QTY</th>
              <th className="py-1 text-right">PRICE</th>
              <th className="py-1 text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dotted divide-gray-400">
            {invoice.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1">
                  <div className="font-medium truncate max-w-[120px]">{item.product_name}</div>
                  <span className="text-[9px] text-gray-600">HSN: {item.hsn_code}</span>
                </td>
                <td className="py-1 text-center">{item.quantity}</td>
                <td className="py-1 text-right">{item.rate}</td>
                <td className="py-1 text-right font-bold">{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pt-2 border-t border-dashed border-black space-y-1">
          <div className="flex justify-between">
            <span>SUBTOTAL:</span>
            <span>{invoice.subtotal.toFixed(2)}</span>
          </div>
          {isInterState ? (
            <div className="flex justify-between">
              <span>IGST:</span>
              <span>{invoice.total_igst.toFixed(2)}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <span>CGST:</span>
                <span>{invoice.total_cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST:</span>
                <span>{invoice.total_sgst.toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-xs font-bold pt-1 border-t border-black">
            <span>GRAND TOTAL:</span>
            <span>{formatINR(invoice.grand_total)}</span>
          </div>
          <div className="flex justify-between">
            <span>PAID:</span>
            <span>{formatINR(invoice.paid_amount)}</span>
          </div>
          <div className="flex justify-between text-red-600 font-bold">
            <span>BALANCE DUE:</span>
            <span>{formatINR(invoice.balance_due)}</span>
          </div>
        </div>

        {/* Thermal Dynamic UPI QR */}
        {payableAmount > 0 && (
          <div className="mt-3 pt-2 border-t border-dashed border-black flex flex-col items-center text-center">
            <span className="text-[9px] font-bold uppercase mb-1">⚡ Scan to Pay via UPI</span>
            <div className="p-1.5 bg-white border border-black inline-block">
              <QRCodeSVG value={upiUrl} size={90} level="M" includeMargin={false} />
            </div>
            <p className="text-[9px] mt-1 font-bold">{formatINR(payableAmount)}</p>
            <p className="text-[8px] text-gray-700 font-mono">{upiId}</p>
          </div>
        )}

        <div className="text-center pt-3 border-t border-dashed border-black text-[9px]">
          <p>Thank you for your business!</p>
          <p>Computer Generated Invoice</p>
        </div>
      </div>
    );
  }

  // Modern & Professional A4 GST Invoice Template
  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-white text-slate-900 text-xs printable-document shadow-sm border border-slate-200">
      {/* Header Bar */}
      <div className="flex items-start justify-between pb-6 border-b-2 border-slate-900">
        <div>
          <span className="inline-block px-2.5 py-0.5 mb-2 text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white rounded-xs">
            TAX INVOICE
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">{company.name}</h1>
          <p className="text-slate-600 mt-1 max-w-sm">{company.address}, {company.city} - {company.pin_code}, {company.state}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-slate-600 font-mono text-[11px]">
            <span><strong>GSTIN:</strong> {company.gstin}</span>
            <span><strong>PAN:</strong> {company.pan}</span>
            <span><strong>State Code:</strong> {company.state_code}</span>
          </div>
          <p className="text-slate-500 mt-1">Ph: {company.phone} · Email: {company.email}</p>
        </div>

        <div className="text-right">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg inline-block text-left min-w-[200px]">
            <div className="text-slate-500 text-[11px]">Invoice Number:</div>
            <div className="text-base font-bold font-mono text-slate-900">{invoice.invoice_number}</div>
            <div className="mt-2 text-slate-500 text-[11px]">Invoice Date:</div>
            <div className="font-semibold text-slate-800">{invoice.invoice_date}</div>
            <div className="mt-1 text-slate-500 text-[11px]">Due Date:</div>
            <div className="font-semibold text-slate-800">{invoice.due_date}</div>
            {invoice.challan_id && (
              <div className="mt-1 text-[11px] text-blue-600 font-medium">Ref Challan Attached</div>
            )}
          </div>
        </div>
      </div>

      {/* Bill To & Ship To Grid */}
      <div className="grid grid-cols-2 gap-6 py-4 border-b border-slate-200">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Billed To (Customer):</h3>
          <p className="text-sm font-bold text-slate-900">{invoice.customer_name}</p>
          <p className="text-slate-600 mt-1 leading-relaxed">{invoice.billing_address}</p>
          <div className="mt-2 space-y-0.5 text-[11px] text-slate-600 font-mono">
            {invoice.customer_gstin && <p><strong>GSTIN:</strong> {invoice.customer_gstin}</p>}
            <p><strong>Place of Supply (State):</strong> {invoice.customer_state}</p>
            {invoice.customer_phone && <p><strong>Phone:</strong> {invoice.customer_phone}</p>}
          </div>
        </div>

        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Dispatched From / Warehouse:</h3>
          <p className="text-sm font-semibold text-slate-900">{company.name} Central Dispatch</p>
          <p className="text-slate-600 mt-1 leading-relaxed">
            {invoice.shipping_address || invoice.billing_address}
          </p>
          <div className="mt-2 text-[11px] text-slate-600">
            <p><strong>Payment Mode:</strong> {invoice.payment_method}</p>
            <p><strong>Supply Type:</strong> {isInterState ? 'Inter-State Supply (IGST)' : 'Intra-State Supply (CGST + SGST)'}</p>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <table className="w-full my-4 border-collapse text-left">
        <thead>
          <tr className="bg-slate-100 text-slate-700 font-bold border-y border-slate-300">
            <th className="py-2.5 px-2 w-8 text-center">#</th>
            <th className="py-2.5 px-3">Item Description</th>
            <th className="py-2.5 px-2 text-center">HSN/SAC</th>
            <th className="py-2.5 px-2 text-center">Qty</th>
            <th className="py-2.5 px-2 text-right">Unit Rate</th>
            <th className="py-2.5 px-2 text-right">Disc %</th>
            <th className="py-2.5 px-2 text-right">Taxable</th>
            <th className="py-2.5 px-2 text-center">GST %</th>
            {isInterState ? (
              <th className="py-2.5 px-2 text-right">IGST</th>
            ) : (
              <>
                <th className="py-2.5 px-2 text-right">CGST</th>
                <th className="py-2.5 px-2 text-right">SGST</th>
              </>
            )}
            <th className="py-2.5 px-3 text-right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {invoice.items.map((item, idx) => (
            <tr key={idx} className="hover:bg-slate-50/50">
              <td className="py-3 px-2 text-center text-slate-500 font-mono">{idx + 1}</td>
              <td className="py-3 px-3">
                <span className="font-semibold text-slate-900">{item.product_name}</span>
                <span className="block text-[10px] text-slate-500">Unit: {item.unit}</span>
              </td>
              <td className="py-3 px-2 text-center font-mono text-slate-600">{item.hsn_code}</td>
              <td className="py-3 px-2 text-center font-mono font-semibold">{item.quantity}</td>
              <td className="py-3 px-2 text-right font-mono tabular-nums">{item.rate.toFixed(2)}</td>
              <td className="py-3 px-2 text-right font-mono tabular-nums">{item.discount_percent}%</td>
              <td className="py-3 px-2 text-right font-mono tabular-nums font-medium">{item.taxable_amount.toFixed(2)}</td>
              <td className="py-3 px-2 text-center font-mono">{item.gst_rate}%</td>
              {isInterState ? (
                <td className="py-3 px-2 text-right font-mono tabular-nums text-slate-600">{item.igst_amount.toFixed(2)}</td>
              ) : (
                <>
                  <td className="py-3 px-2 text-right font-mono tabular-nums text-slate-600">{item.cgst_amount.toFixed(2)}</td>
                  <td className="py-3 px-2 text-right font-mono tabular-nums text-slate-600">{item.sgst_amount.toFixed(2)}</td>
                </>
              )}
              <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                {item.total.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary & Bank Details Section */}
      <div className="grid grid-cols-12 gap-6 pt-2 pb-6 border-b border-slate-200">
        {/* Left Column: Bank Details & Terms */}
        <div className="col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className={`${payableAmount > 0 ? 'sm:col-span-8' : 'sm:col-span-12'} p-3 bg-slate-50 rounded-lg border border-slate-200`}>
              <h4 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider mb-2">
                Bank Details for Electronic Transfer (NEFT / RTGS / IMPS)
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-mono">
                <p><strong>Bank:</strong> {company.bank_name}</p>
                <p><strong>A/C No:</strong> {company.account_number}</p>
                <p><strong>IFSC:</strong> {company.ifsc}</p>
                <p><strong>Branch:</strong> {company.branch}</p>
              </div>
            </div>

            {payableAmount > 0 && (
              <div className="sm:col-span-4 p-2 bg-indigo-50/40 rounded-lg border border-indigo-100 flex flex-col items-center justify-center text-center">
                <div className="p-1 bg-white border border-slate-200 rounded shadow-2xs">
                  <QRCodeSVG value={upiUrl} size={72} level="M" includeMargin={false} />
                </div>
                <span className="text-[9px] font-bold text-indigo-900 uppercase tracking-tight mt-1">
                  ⚡ Scan & Pay via UPI
                </span>
                <p className="text-[8px] font-mono text-slate-600 truncate max-w-[120px]">{upiId}</p>
                <span className="text-[8px] font-bold text-emerald-700 font-mono">
                  {formatINR(payableAmount)}
                </span>
              </div>
            )}
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Amount in Words</h4>
            <p className="text-slate-700 italic font-medium mt-0.5">{amountInWords(invoice.grand_total)}</p>
          </div>

          {invoice.notes && (
            <div>
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Notes & Remarks</h4>
              <p className="text-slate-600 whitespace-pre-line mt-0.5">{invoice.notes}</p>
            </div>
          )}

          <div>
            <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Terms & Conditions</h4>
            <p className="text-[10px] text-slate-500 whitespace-pre-line leading-relaxed mt-0.5">
              {invoice.terms_and_conditions || company.address}
            </p>
          </div>
        </div>

        {/* Right Column: Tax Breakdown & Grand Total */}
        <div className="col-span-5 space-y-2">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 font-mono text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Value:</span>
              <span className="font-bold text-slate-900 tabular-nums">{formatINR(invoice.taxable_amount)}</span>
            </div>

            {invoice.total_discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Total Discount:</span>
                <span>-{formatINR(invoice.total_discount)}</span>
              </div>
            )}

            {isInterState ? (
              <div className="flex justify-between text-slate-600">
                <span>Integrated GST (IGST):</span>
                <span className="tabular-nums">{formatINR(invoice.total_igst)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Central GST (CGST):</span>
                  <span className="tabular-nums">{formatINR(invoice.total_cgst)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>State GST (SGST):</span>
                  <span className="tabular-nums">{formatINR(invoice.total_sgst)}</span>
                </div>
              </>
            )}

            {invoice.round_off !== 0 && (
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Round Off:</span>
                <span>{invoice.round_off > 0 ? `+${invoice.round_off.toFixed(2)}` : invoice.round_off.toFixed(2)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-300 flex justify-between text-sm font-bold text-slate-900">
              <span>Grand Total:</span>
              <span className="text-base text-blue-900">{formatINR(invoice.grand_total)}</span>
            </div>

            <div className="pt-2 border-t border-dashed border-slate-200 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Amount Paid:</span>
                <span className="text-emerald-700 font-semibold">{formatINR(invoice.paid_amount)}</span>
              </div>
              <div className="flex justify-between text-slate-800 font-bold">
                <span>Balance Due:</span>
                <span className={invoice.balance_due > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                  {formatINR(invoice.balance_due)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signature & Footer */}
      <div className="flex items-end justify-between pt-6">
        <div className="text-[10px] text-slate-400 max-w-xs">
          <p>Certified that the particulars given above are true and correct.</p>
          <p className="mt-1">Generated electronically via Cloud Accounting System.</p>
        </div>

        <div className="text-center w-52">
          <div className="h-14 border-b border-slate-300 flex items-end justify-center pb-1">
            <span className="font-serif italic text-slate-600 text-xs">For {company.legal_name}</span>
          </div>
          <p className="text-[11px] font-bold text-slate-800 mt-1">Authorised Signatory</p>
        </div>
      </div>
    </div>
  );
}
