import { notFound } from "next/navigation";
import { OrderPage } from "@/features/checkout/order-page";
export async function OrderScreen({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  if (!/^[a-f0-9]{24}$/.test(reference)) notFound();
  return <OrderPage reference={reference} />;
}
