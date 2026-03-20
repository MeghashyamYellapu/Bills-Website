import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReceiptSchema } from "@shared/schema";
import type { ReceiptInput } from "@shared/routes";
import { useCreateReceipt } from "@/hooks/use-receipts";
import { format } from "date-fns";
import { 
  Download, 
  Share2, 
  RefreshCcw, 
  CheckCircle2,
  FileText
} from "lucide-react";

import { Input } from "@/components/Input";
import { DateInput } from "@/components/DateInput";
import { ReceiptPreview } from "@/components/ReceiptPreview";
import { useToast } from "@/hooks/use-toast";

type ReceiptSnapshot = {
  signature: string;
  createdAt: number;
  canvas: HTMLCanvasElement;
  blob: Blob;
};

const SNAPSHOT_CACHE_TTL_MS = 10_000;
const RECEIPT_SERIAL_STORAGE_KEY = "receipt:lastSerialNumber";

function getStartingSerialNumber() {
  if (typeof window === "undefined") return 2026;

  try {
    const storedValue = window.localStorage.getItem(RECEIPT_SERIAL_STORAGE_KEY);
    const parsedValue = Number.parseInt(storedValue || "", 10);
    if (Number.isFinite(parsedValue) && parsedValue >= 2026) {
      return parsedValue + 1;
    }
  } catch {
    // Ignore localStorage failures and use fallback serial start.
  }

  return 2026;
}

function sanitizeFileNamePart(value: string) {
  const sanitized = value
    .trim()
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, " ");

  return sanitized || "Customer";
}

function createDefaultValues(receiptNo: string): Partial<ReceiptInput> {
  const now = new Date();
  const previousMonth = new Date(now);
  previousMonth.setMonth(now.getMonth() - 1);

  return {
    companyName: "Sri Bhavani Cable Network  Chuchukonda,Mellipaka",
    companyPhone: "9010040199 / 9246340199",
    receiptNo,
    billDateFrom: format(previousMonth, "dd-MMM-yy"),
    billDateTo: format(now, "dd-MMM-yy"),
    recordTime: format(now, "dd-MMM-yy"),
    prevBalance: "0",
    paidAmount: "0",
    netAmount: "0",
    remainingAmount: "0.0",
    paymentMode: "CASH",
    collectedBy: "Admin",
  };
}

export default function Home() {
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);
  const nextReceiptNumberRef = useRef(getStartingSerialNumber());
  const snapshotCacheRef = useRef<ReceiptSnapshot | null>(null);
  const snapshotInFlightRef = useRef<Promise<ReceiptSnapshot> | null>(null);
  const createReceipt = useCreateReceipt();

  const getNextReceiptNumber = useCallback(() => {
    const nextNumber = nextReceiptNumberRef.current;
    nextReceiptNumberRef.current += 1;

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(RECEIPT_SERIAL_STORAGE_KEY, String(nextNumber));
      } catch {
        // Ignore localStorage failures and continue with in-memory serial.
      }
    }

    return String(nextNumber);
  }, []);

  const defaultValues = useMemo(
    () => createDefaultValues(getNextReceiptNumber()),
    [getNextReceiptNumber],
  );

  const form = useForm<ReceiptInput>({
    resolver: zodResolver(insertReceiptSchema),
    defaultValues,
  });

  const previewValues = useWatch({ control: form.control });
  const watchedRecordTime = useWatch({ control: form.control, name: "recordTime" });
  const watchedBillDateFrom = useWatch({ control: form.control, name: "billDateFrom" });
  const watchedBillDateTo = useWatch({ control: form.control, name: "billDateTo" });
  const watchedPrevBalance = useWatch({ control: form.control, name: "prevBalance" });
  const watchedPaidAmount = useWatch({ control: form.control, name: "paidAmount" });

  const previewData = useMemo(
    () => ({ ...defaultValues, ...previewValues }),
    [defaultValues, previewValues],
  );

  const receiptSignature = useMemo(() => JSON.stringify(previewData), [previewData]);
  const receiptFileName = useMemo(
    () => {
      const customerName = sanitizeFileNamePart(previewData.customerName || "Customer");
      return `Receipt-${customerName}`;
    },
    [previewData.customerName],
  );

  useEffect(() => {
    const prev = Number.parseFloat(watchedPrevBalance || "0");
    const paid = Number.parseFloat(watchedPaidAmount || "0");

    const safePrev = Number.isFinite(prev) ? prev : 0;
    const safePaid = Number.isFinite(paid) ? paid : 0;

    const nextNet = safePaid.toString();
    const nextRemaining = Math.max(0, safePrev - safePaid).toFixed(1);

    if (form.getValues("netAmount") !== nextNet) {
      form.setValue("netAmount", nextNet, { shouldDirty: true });
    }

    if (form.getValues("remainingAmount") !== nextRemaining) {
      form.setValue("remainingAmount", nextRemaining, { shouldDirty: true });
    }
  }, [watchedPrevBalance, watchedPaidAmount, form]);

  const captureReceiptCanvas = useCallback(async () => {
    if (!receiptRef.current) return;
    const { default: html2canvas } = await import("html2canvas");

    const sourceNode = receiptRef.current;
    const clonedNode = sourceNode.cloneNode(true) as HTMLDivElement;
    const sandbox = document.createElement("div");

    sandbox.style.position = "fixed";
    sandbox.style.left = "-10000px";
    sandbox.style.top = "0";
    sandbox.style.pointerEvents = "none";
    sandbox.style.background = "#ffffff";
    sandbox.style.padding = "0";
    sandbox.style.margin = "0";
    sandbox.style.zIndex = "-1";

    clonedNode.style.transform = "none";
    clonedNode.style.width = `${sourceNode.offsetWidth}px`;
    clonedNode.style.maxWidth = `${sourceNode.offsetWidth}px`;
    clonedNode.style.margin = "0";

    sandbox.appendChild(clonedNode);
    document.body.appendChild(sandbox);

    try {
      return await html2canvas(clonedNode, {
        scale: Math.max(2, window.devicePixelRatio || 1),
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
      });
    } finally {
      sandbox.remove();
    }
  }, []);

  const getReceiptSnapshot = useCallback(async () => {
    const cached = snapshotCacheRef.current;
    if (
      cached &&
      cached.signature === receiptSignature &&
      Date.now() - cached.createdAt < SNAPSHOT_CACHE_TTL_MS
    ) {
      return cached;
    }

    if (snapshotInFlightRef.current) {
      return snapshotInFlightRef.current;
    }

    const buildSnapshotPromise = (async (): Promise<ReceiptSnapshot> => {
      const canvas = await captureReceiptCanvas();
      if (!canvas) {
        throw new Error("Receipt preview not ready");
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );

      if (!blob) {
        throw new Error("Failed to generate image blob");
      }

      const snapshot: ReceiptSnapshot = {
        signature: receiptSignature,
        createdAt: Date.now(),
        canvas,
        blob,
      };

      snapshotCacheRef.current = snapshot;
      return snapshot;
    })();

    snapshotInFlightRef.current = buildSnapshotPromise;

    try {
      return await buildSnapshotPromise;
    } finally {
      snapshotInFlightRef.current = null;
    }
  }, [captureReceiptCanvas, receiptSignature]);

  const downloadBlob = useCallback((blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = fileName;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleDownloadImage = useCallback(async () => {
    try {
      const snapshot = await getReceiptSnapshot();
      downloadBlob(snapshot.blob, `${receiptFileName}.png`);
      toast({ title: "Success", description: "Receipt image downloaded" });
    } catch {
      toast({ title: "Error", description: "Failed to generate image", variant: "destructive" });
    }
  }, [downloadBlob, getReceiptSnapshot, receiptFileName, toast]);

  const handleDownloadPDF = useCallback(async () => {
    try {
      const [snapshot, jsPDFModule] = await Promise.all([
        getReceiptSnapshot(),
        import("jspdf"),
      ]);

      const jsPDF = jsPDFModule.default;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 150],
      });
      const width = pdf.internal.pageSize.getWidth();
      const height = (snapshot.canvas.height * width) / snapshot.canvas.width;
      pdf.addImage(snapshot.canvas, "PNG", 0, 0, width, height);
      pdf.save(`${receiptFileName}.pdf`);
      toast({ title: "Success", description: "Receipt PDF downloaded" });
    } catch {
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    }
  }, [getReceiptSnapshot, receiptFileName, toast]);

  const handleShareWhatsApp = useCallback(async () => {
    if (!previewData.mobileNumber) {
      toast({ title: "Missing Number", description: "Please enter a customer mobile number", variant: "destructive" });
      return;
    }

    try {
      const snapshot = await getReceiptSnapshot();
      const file = new File([snapshot.blob], `${receiptFileName}.png`, { type: 'image/png' });
      const shareMessage = `*Payment Receipt*\nBusiness: ${previewData.companyName}\nReceipt No: ${previewData.receiptNo}\nAmount Paid: ₹${previewData.paidAmount}\nDate: ${previewData.recordTime}`;
      const phoneNumber = String(previewData.mobileNumber).replace(/\D/g, "");
      const navigatorWithShare = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };

      if (navigatorWithShare.share) {
        const supportsFileShare =
          typeof navigatorWithShare.canShare !== "function" ||
          navigatorWithShare.canShare({ files: [file] });

        if (supportsFileShare) {
          try {
            await navigatorWithShare.share({
              files: [file],
              title: "Payment Receipt",
              text: shareMessage,
            });
            toast({ title: "Shared!", description: "Receipt sent successfully." });
            return;
          } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
              return;
            }
          }
        }
      }

      const message = encodeURIComponent(
        `${shareMessage}\n\n` +
        `Please download and attach the receipt image/PDF for your records.`
      );

      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
      downloadBlob(snapshot.blob, `${receiptFileName}.png`);

      toast({
        title: "Receipt Downloaded",
        description: "WhatsApp opened. Please attach the downloaded receipt image to the chat.",
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to share receipt", variant: "destructive" });
    }
  }, [downloadBlob, getReceiptSnapshot, previewData, receiptFileName, toast]);

  const onSubmit = useCallback((data: ReceiptInput) => {
    createReceipt.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Saved!",
          description: "Receipt saved to database successfully.",
          action: <CheckCircle2 className="text-green-500" />
        });
      },
      onError: (err) => {
        toast({
          title: "Failed to save",
          description: err.message,
          variant: "destructive"
        });
      },
    });
  }, [createReceipt, toast]);

  const handleReset = useCallback(() => {
    const resetValues = createDefaultValues(getNextReceiptNumber());
    form.reset(resetValues);
    toast({ title: "Reset", description: "Form cleared for new entry" });
  }, [form, getNextReceiptNumber, toast]);

  const setDateField = useCallback(
    (field: "recordTime" | "billDateFrom" | "billDateTo", value: string) => {
      form.setValue(field, value, { shouldDirty: true, shouldTouch: true });
    },
    [form],
  );

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans">
      
      {/* LEFT SIDE - FORM */}
      <div className="flex-1 p-4 lg:p-8 overflow-y-auto max-h-screen custom-scrollbar">
        <div className="max-w-xl mx-auto space-y-6">
          
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
              New Receipt
            </h1>
            <p className="text-sm text-slate-500">
              Fill in the details below to generate a professional receipt.
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Section: Business Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Business Name" {...form.register("companyName")} />
                <Input label="Contact Number" {...form.register("companyPhone")} />
                <Input label="Receipt #" {...form.register("receiptNo")} />
                <DateInput
                  label="Date"
                  value={watchedRecordTime}
                  onChange={(value) => setDateField("recordTime", value)}
                  placeholder="dd-MMM-yy"
                />
              </div>
            </div>

            {/* Section: Customer Details */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Customer Name" {...form.register("customerName")} placeholder="Name" />
                <Input label="Mobile (WhatsApp)" {...form.register("mobileNumber")} placeholder="Phone number" />
                <DateInput
                  label="From Date"
                  value={watchedBillDateFrom}
                  onChange={(value) => setDateField("billDateFrom", value)}
                  placeholder="dd-MMM-yy"
                />
                <DateInput
                  label="To Date"
                  value={watchedBillDateTo}
                  onChange={(value) => setDateField("billDateTo", value)}
                  placeholder="dd-MMM-yy"
                />
              </div>
            </div>

            {/* Section: Payment Details */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input 
                  label="Prev. Balance" 
                  {...form.register("prevBalance")} 
                  type="number" 
                />
                <Input 
                  label="Paid Amount" 
                  {...form.register("paidAmount")} 
                  type="number" 
                  className="font-bold text-indigo-600 bg-indigo-50/30"
                />
                <Input 
                  label="Mode" 
                  {...form.register("paymentMode")} 
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
               <button
                type="submit"
                disabled={createReceipt.isPending}
                className="
                  flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold
                  bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-all
                  disabled:opacity-50
                "
              >
                {createReceipt.isPending ? "Saving..." : "Save Record"}
              </button>
              
              <button
                type="button"
                onClick={handleReset}
                className="
                  px-6 py-3 rounded-lg font-semibold text-slate-600
                  bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all
                  flex items-center justify-center gap-2
                "
              >
                <RefreshCcw className="w-4 h-4" />
                Reset
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* RIGHT SIDE - PREVIEW */}
      <div className="lg:w-[480px] bg-slate-50 p-4 lg:p-8 flex flex-col border-l border-slate-200">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            Preview
          </h2>
          <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded">
            Digital Format
          </span>
        </div>

        {/* The Receipt Container */}
        <div className="flex-1 flex items-center justify-center relative">
          <div className="relative shadow-xl scale-90 origin-top">
            <ReceiptPreview ref={receiptRef} data={previewData} />
          </div>
        </div>

        {/* Export Actions */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <button
            onClick={handleShareWhatsApp}
            className="
              flex flex-col items-center gap-1.5 p-3 rounded-xl
              bg-white border border-slate-200
              text-slate-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/50
              transition-all group
            "
          >
            <Share2 className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-tight">WhatsApp</span>
          </button>

          <button
            onClick={handleDownloadImage}
            className="
              flex flex-col items-center gap-1.5 p-3 rounded-xl
              bg-white border border-slate-200
              text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50
              transition-all group
            "
          >
            <Download className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-tight">Image</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="
              flex flex-col items-center gap-1.5 p-3 rounded-xl
              bg-white border border-slate-200
              text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50
              transition-all group
            "
          >
            <FileText className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-tight">PDF</span>
          </button>
        </div>
      </div>

    </div>
  );
}
