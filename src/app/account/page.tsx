"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { friendlyError, type User } from "@/lib/api";
import { useApiQuery, useApiMutation } from "@/lib/query/hooks";
import { authStateChanged } from "@/lib/query/provider";
import { profileSchema } from "@/lib/forms/schemas";
import { FormErrors } from "@/lib/forms/form-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";

export default function AccountPage() {
  const router = useRouter();
  const account = useApiQuery<{ user: User }>({ path: "/api/account/me" });
  const user = account.data?.user;
  const form = useForm<{ name: string }>({ resolver: zodResolver(profileSchema), values: { name: user?.name ?? "" } });
  const update = useApiMutation<{ user: User }, { name: string }>(payload => ({ path: "/api/account/me", method: "PATCH", payload, notifications: { success: "Your name has been updated." } }), ["/api/account/me"]);
  const [logoutError, setLogoutError] = useState("");
  const [leaving, setLeaving] = useState(false);
  async function logout() {
    setLeaving(true);
    try { await signOut({ redirect: false }); router.push("/"); router.refresh(); authStateChanged(); notifySuccess("Signed out."); }
    catch (failure) { setLogoutError(friendlyError(failure)); notifyError(failure); setLeaving(false); }
  }
  return <main id="main-content" className="form-page"><h1>My account</h1>
    {(account.error || update.error || logoutError) && <p role="alert" className="form-error">{logoutError || friendlyError(account.error ?? update.error)}</p>}
    {!user ? <p>{account.error ? <Link href="/login">Sign in</Link> : "Loading your account…"}</p> : <>
      <p>{user.email} · {user.email_verified ? "Email verified" : "Email not verified (optional)"}</p>
      {!user.email_verified && <p><Link href="/verify-email">Verify my email</Link> — you can keep using your account without verification.</p>}
      <form noValidate onSubmit={form.handleSubmit(values => update.mutate(values))} className="panel-form"><label>Name<input {...form.register("name")} aria-invalid={!!form.formState.errors.name} maxLength={255} /></label><FormErrors errors={form.formState.errors} /><button className="primary-button" disabled={update.isPending || leaving}>Save name</button></form>
      {update.isSuccess && <p role="status">Your name has been updated.</p>}
      {user.is_staff && <p><Link href="/admin">Open administration</Link></p>}
      <button className="secondary-button" onClick={logout} disabled={leaving}>Sign out</button>
    </>}
  </main>;
}
