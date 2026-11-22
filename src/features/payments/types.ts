import type { Order } from "@/features/checkout/types";

export type BankAccount = { id: number; name: string; bank_name: string; account_title: string; account_number: string; iban: string; instructions: string };
export type Submission = { id: number; reference: string; bank: BankAccount; created_at: string; decision: "approve" | "reject" | null; note: string | null };
export type PaymentDetails = { method: string; status: string; amount: string; currency: string; bank_accounts: BankAccount[]; submissions: Submission[] };
export type StaffPayment = { id: number; order: Order; payment: PaymentDetails };
export type PaymentRow = { id: number; reference: string; status: string; method: string; payment_status: string; total: string };
