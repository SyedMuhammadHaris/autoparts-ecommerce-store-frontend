"use client";
import Link from "next/link";
import { useApiQuery } from "@/lib/query/hooks";
import type { Cart } from "./types";

export function CartLink() {
  const cart = useApiQuery<Cart>({ path: "/api/cart" });
  return <Link href="/cart">Cart{cart.data ? ` (${cart.data.item_count})` : ""}</Link>;
}
