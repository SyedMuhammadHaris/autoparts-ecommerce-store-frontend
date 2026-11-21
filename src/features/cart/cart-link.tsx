"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Cart } from "./types";

export function CartLink() {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    const refresh = () => apiRequest<Cart>("/api/cart").then(cart => { if (active) setCount(cart.item_count); }).catch(() => { if (active) setCount(null); });
    void refresh();
    window.addEventListener("cart-changed", refresh);
    return () => { active = false; window.removeEventListener("cart-changed", refresh); };
  }, [pathname]);
  return <Link href="/cart">Cart{count !== null ? ` (${count})` : ""}</Link>;
}
