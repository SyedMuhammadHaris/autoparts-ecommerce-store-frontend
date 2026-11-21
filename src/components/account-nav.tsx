"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type User } from "@/lib/api";
import { useApiQuery } from "@/lib/query/hooks";
import { CartLink } from "@/features/cart/cart-link";

export function AccountNav() {
  const pathname = usePathname();
  const account = useApiQuery<{ user: User }>({ path: "/api/account/me", query: {} });
  const user = account.data?.user;
  return <nav className="account-nav" aria-label="Main navigation" data-page={pathname}>
    <Link href="/products">Shop parts</Link><CartLink />
    {user && <Link href="/orders">Orders</Link>}
    {user?.is_staff && <Link href="/admin">Administration</Link>}
    <Link href={user ? "/account" : "/login"}>{user ? "My account" : "Sign in"}</Link>
  </nav>;
}
