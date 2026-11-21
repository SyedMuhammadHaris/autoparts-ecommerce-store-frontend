import type { Metadata } from "next";
import { PaymentWorkspace } from "@/features/payments/payment-workspace";

export const metadata: Metadata = { title: "Payment management", robots: { index: false, follow: false } };
export default function Page() { return <PaymentWorkspace />; }
