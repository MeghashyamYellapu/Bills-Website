import React, { forwardRef, memo } from 'react';
import type { ReceiptInput } from "@shared/routes";
import { format } from "date-fns";

interface ReceiptPreviewProps {
  data: Partial<ReceiptInput>;
}

const ReceiptPreviewBase = forwardRef<HTMLDivElement, ReceiptPreviewProps>(({ data }, ref) => {
  // Default fallbacks to prevent empty rendering
  const companyName = data.companyName || "Sri Bhavani Cable Network  Chuchukonda,Mellipaka";
  const companyPhone = data.companyPhone || "9010040199 / 9246340199";
  const customerName = data.customerName || "Customer Name";
  const receiptNo = data.receiptNo || "0000";
  const billDateFrom = data.billDateFrom || format(new Date(), "dd-MMM-yy");
  const billDateTo = data.billDateTo || format(new Date(), "dd-MMM-yy");
  const recordTime = data.recordTime || format(new Date(), "dd-MMM-yy");
  
  const prevBalance = data.prevBalance || "0";
  const paidAmount = data.paidAmount || "0";
  const netAmount = data.netAmount || "0";
  const remainingAmount = data.remainingAmount || "0.0";

  return (
    <div 
      ref={ref} 
      className="bg-white text-slate-900 p-10 max-w-[450px] mx-auto shadow-2xl relative border border-slate-100"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Receipt Header */}
      <div className="text-center mb-8 pb-6 border-b border-slate-100">
        <div className="inline-block bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
          Payment Receipt
        </div>
        <h1 
          className="text-3xl font-extrabold mb-1 tracking-tight leading-none text-slate-900" 
        >
          {companyName}
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-2">Contact: {companyPhone}</p>
      </div>

      {/* Customer Info Grid */}
      <div className="space-y-4 text-xs mb-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-2 border-b border-slate-50 gap-1">
          <span className="text-slate-400 font-medium uppercase tracking-wider">Customer Name</span>
          <span className="text-sm font-bold text-slate-900 break-words">{customerName}</span>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-2 border-b border-slate-50 gap-1">
          <span className="text-slate-400 font-medium uppercase tracking-wider">Billing Period</span>
          <span className="text-slate-700 font-semibold break-words">{billDateFrom} — {billDateTo}</span>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-1">
            <span className="text-slate-400 font-medium uppercase tracking-wider block">Receipt No</span>
            <span className="text-slate-900 font-bold">{receiptNo}</span>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-slate-400 font-medium uppercase tracking-wider block">Date</span>
            <span className="text-slate-900 font-bold">{recordTime}</span>
          </div>
        </div>
      </div>

      {/* Financial Table */}
      <div className="mb-6">
        <div className="bg-slate-50 px-4 py-2 flex justify-between rounded-t-lg border border-slate-100 border-b-0">
          <span className="uppercase font-bold text-[10px] text-slate-500 tracking-widest">Description</span>
          <span className="uppercase font-bold text-[10px] text-slate-500 tracking-widest text-right">Amount</span>
        </div>
        
        <div className="border-x border-slate-100 divide-y divide-slate-50">
          <div className="px-4 py-3 flex justify-between items-center hover:bg-slate-50/50 transition-colors gap-4">
            <span className="text-slate-600 font-medium whitespace-nowrap">Previous Balance</span>
            <span className="font-bold text-slate-900 break-all text-right">₹{prevBalance}</span>
          </div>
          <div className="px-4 py-3 flex justify-between items-center hover:bg-slate-50/50 transition-colors gap-4">
            <span className="text-slate-600 font-medium whitespace-nowrap">Amount Paid</span>
            <span className="font-bold text-slate-900 break-all text-right">₹{paidAmount}</span>
          </div>
        </div>
        
        <div className="px-4 py-4 bg-indigo-600 rounded-b-lg flex justify-between items-center text-white shadow-lg shadow-indigo-100">
          <span className="uppercase font-bold text-xs tracking-widest opacity-80">Remaining Balance</span>
          <span className="text-xl font-black italic ml-4">₹{remainingAmount}</span>
        </div>
      </div>

      {/* Footer Details */}
      <div className="space-y-4 mb-10">
         <div className="flex justify-between items-end px-1 pt-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <p className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">Payment Mode: {data.paymentMode || "CASH"}</p>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Collected by: <span className="text-slate-600">{data.collectedBy || "System Admin"}</span></p>
            </div>
            <div className="text-right">
               <p className="text-[9px] font-black text-slate-900 tracking-tighter opacity-20 uppercase">Authentic Receipt</p>
               <p className="text-[8px] text-slate-300 font-medium uppercase tracking-widest">Digital Audit Log</p>
            </div>
         </div>
      </div>

      {/* Disclaimer */}
      <div className="text-[10px] text-center text-slate-400 font-medium border-t border-slate-100 pt-6 px-4 leading-relaxed">
        This is a digitally generated receipt and does not require a physical signature.
      </div>

      {/* Modern Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 rounded-b-lg opacity-10"></div>
    </div>
  );
});

export const ReceiptPreview = memo(ReceiptPreviewBase);
ReceiptPreview.displayName = "ReceiptPreview";
