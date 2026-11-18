"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState, type FormEvent } from "react";
import { apiRequest, friendlyError, type User } from "@/lib/api";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const load = () => apiRequest<{ user: User }>("/api/account/me").then(value => setUser(value.user)).catch(() => { setUser(null); setError("Sign in to view your account."); });
    void load(); window.addEventListener("pageshow", load);
    return () => window.removeEventListener("pageshow", load);
  }, []);
  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setSaved("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await apiRequest<{ user: User }>("/api/account/me", "PATCH", { name: data.get("name") });
      setUser(result.user); setSaved("Your name has been updated.");
    } catch (failure) { setError(friendlyError(failure)); } finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true);
    try { await signOut({ redirect: false }); router.push("/"); router.refresh(); }
    catch (failure) { setError(friendlyError(failure)); setBusy(false); }
  }
  return <main id="main-content" className="form-page">
    <h1>My account</h1>
    {error && <p role="alert" className="form-error">{error}</p>}
    {!user ? <p>{error ? <Link href="/login">Sign in</Link> : "Loading your account…"}</p> : <>
      <p>{user.email} · {user.email_verified ? "Email verified" : "Email not verified (optional)"}</p>
      {!user.email_verified && <p><Link href="/verify-email">Verify my email</Link> — you can keep using your account without verification.</p>}
      <form onSubmit={update} className="panel-form"><label>Name<input name="name" defaultValue={user.name} required maxLength={255} /></label><button className="primary-button" disabled={busy}>Save name</button></form>
      {saved && <p role="status">{saved}</p>}
      {user.is_staff && <p><Link href="/admin">Open administration</Link></p>}
      <button className="secondary-button" onClick={logout} disabled={busy}>Sign out</button>
    </>}
  </main>;
}
