import type { Metadata } from "next";
import { OrderList } from "@/features/checkout/order-list";
export const metadata: Metadata = { title: "Your orders", robots: { index: false, follow: false } };
export default OrderList;
