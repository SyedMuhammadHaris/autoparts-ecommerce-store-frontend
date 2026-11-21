import type { Metadata } from "next";
import { OrderScreen } from "@/features/checkout/order-screen";

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

export default function Page(props: { params: Promise<{ reference: string }> }) {
  return <OrderScreen {...props} />;
}
