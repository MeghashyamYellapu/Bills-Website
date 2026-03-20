import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  // Company Details (defaults matching the image, but editable)
  companyName: text("company_name").notNull().default("Shyam Bhavani Cable Network"),
  companyPhone: text("company_phone").notNull().default("9010040199"),
  
  // Customer Details
  customerName: text("customer_name").notNull(),
  mobileNumber: text("mobile_number").notNull(), // For WhatsApp sharing
  
  // Bill Details
  billDateFrom: text("bill_date_from").notNull(), // Text to match "09-Jan-26" format flexibility
  billDateTo: text("bill_date_to").notNull(),
  receiptNo: text("receipt_no").notNull(),
  recordTime: text("record_time").notNull(), // Text to allow manual "10-Jan-26 10:36"
  
  // Amounts
  prevBalance: text("prev_balance").notNull().default("0"),
  paidAmount: text("paid_amount").notNull().default("0"),
  netAmount: text("net_amount").notNull().default("0"),
  remainingAmount: text("remaining_amount").notNull().default("0.0"),
  
  // Footer
  paymentMode: text("payment_mode").notNull().default("CASH"),
  collectedBy: text("collected_by").notNull().default("Shyam Bhavani Cable Network"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReceiptSchema = createInsertSchema(receipts).omit({ 
  id: true, 
  createdAt: true 
});

export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type Receipt = typeof receipts.$inferSelect;
