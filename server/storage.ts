import type { InsertReceipt, Receipt } from "@shared/schema";

export interface IStorage {
  getReceipts(): Promise<Receipt[]>;
  getReceipt(id: number): Promise<Receipt | undefined>;
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;
  deleteReceipt(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private receipts: Receipt[] = [];
  private nextId = 1;

  async getReceipts(): Promise<Receipt[]> {
    return [...this.receipts];
  }

  async getReceipt(id: number): Promise<Receipt | undefined> {
    return this.receipts.find((receipt) => receipt.id === id);
  }

  async createReceipt(insertReceipt: InsertReceipt): Promise<Receipt> {
    const receipt: Receipt = {
      id: this.nextId++,
      companyName: insertReceipt.companyName ?? "Shyam Bhavani Cable Network",
      companyPhone: insertReceipt.companyPhone ?? "9010040199",
      customerName: insertReceipt.customerName,
      mobileNumber: insertReceipt.mobileNumber,
      billDateFrom: insertReceipt.billDateFrom,
      billDateTo: insertReceipt.billDateTo,
      receiptNo: insertReceipt.receiptNo,
      recordTime: insertReceipt.recordTime,
      prevBalance: insertReceipt.prevBalance ?? "0",
      paidAmount: insertReceipt.paidAmount ?? "0",
      netAmount: insertReceipt.netAmount ?? "0",
      remainingAmount: insertReceipt.remainingAmount ?? "0.0",
      paymentMode: insertReceipt.paymentMode ?? "CASH",
      collectedBy:
        insertReceipt.collectedBy ?? "Shyam Bhavani Cable Network",
      createdAt: new Date(),
    };

    this.receipts.unshift(receipt);
    return receipt;
  }

  async deleteReceipt(id: number): Promise<void> {
    this.receipts = this.receipts.filter((receipt) => receipt.id !== id);
  }
}

export const storage = new MemStorage();
