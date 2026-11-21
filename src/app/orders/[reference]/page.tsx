import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderPage } from "@/features/checkout/order-page";
export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  if (!/^[a-f0-9]{24}$/.test(reference)) notFound();
  return <OrderPage reference={reference} />;
}
