"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest, type User } from "@/lib/api";

export function AccountNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    apiRequest<{ user: User }>("/api/auth/me").then(value => setUser(value.user)).catch(() => setUser(null));
  }, [pathname]);
  return <nav className="account-nav" aria-label="Main navigation">
    <Link href="/products">Shop parts</Link>
    {user?.is_staff && <Link href="/admin">Administration</Link>}
    <Link href={user ? "/account" : "/login"}>{user ? "My account" : "Sign in"}</Link>
  </nav>;
}
