"use client";
import Link from "next/link";
import { ProfileForm } from "./profile-form";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { friendlyError, type User } from "@/lib/api";
import { useApiQuery } from "@/lib/query/hooks";
import { authStateChanged } from "@/lib/query/provider";
import { notifyError, notifySuccess } from "@/lib/notifications";

export function AccountScreen() {
  const router = useRouter();
  const account = useApiQuery<{ user: User }>({ path: "/api/account/me" });
  const user = account.data?.user;
  const [logoutError, setLogoutError] = useState("");
  const [leaving, setLeaving] = useState(false);
  async function logout() {
    setLeaving(true);
    try { await signOut({ redirect: false }); router.push("/"); router.refresh(); authStateChanged(); notifySuccess("Signed out."); }
    catch (failure) { setLogoutError(friendlyError(failure)); notifyError(failure); setLeaving(false); }
  }
  return <main id="main-content" className="form-page"><h1>My account</h1>
    {(account.error || logoutError) && <p role="alert" className="form-error">{logoutError || friendlyError(account.error)}</p>}
    {!user ? <p>{account.error ? <Link href="/login">Sign in</Link> : "Loading your account…"}</p> : <>
      <p>{user.email} · {user.email_verified ? "Email verified" : "Email not verified (optional)"}</p>
      {!user.email_verified && <p><Link href="/verify-email">Verify my email</Link> — you can keep using your account without verification.</p>}
      <ProfileForm user={user} disabled={leaving} />
      <p><Link href="/account/notifications">View order notifications</Link></p>
      {user.is_staff && <p><Link href="/admin">Open administration</Link></p>}
      <button className="secondary-button" onClick={logout} disabled={leaving}>Sign out</button>
    </>}
  </main>;
}
