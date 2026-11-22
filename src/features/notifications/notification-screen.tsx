"use client";
import Link from "next/link";
import { useApiQuery } from "@/lib/query/hooks";
import { friendlyError, type User } from "@/lib/api";
import { NotificationList } from "./notification-list";

export function NotificationScreen() {
  const account = useApiQuery<{ user: User }>({ path: "/api/account/me" });
  return <main id="main-content" className="catalog-page"><h1>Your notifications</h1><Link href="/account">Back to account</Link>
    {account.isPending ? <p role="status">Checking account…</p> : account.data?.user ? <NotificationList /> : <><p>{account.error && friendlyError(account.error)}</p><Link href="/login">Sign in to view account notifications</Link></>}
  </main>;
}
