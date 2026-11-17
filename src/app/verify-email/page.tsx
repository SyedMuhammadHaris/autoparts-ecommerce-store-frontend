"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiRequest, friendlyError } from "@/lib/api";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function send() {
    setBusy(true); setError("");
    try { await apiRequest("/api/auth/verification/send", "POST", {}); setMessage("Delivery requested. Check your email; the code expires in 10 minutes. Wait 60 seconds before resending."); }
    catch (failure) { setError(friendlyError(failure) + " You can skip verification."); } finally { setBusy(false); }
  }
  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const fields = new FormData(event.currentTarget);
    try { await apiRequest("/api/auth/verification/confirm", "POST", { code: fields.get("code") }); router.push("/account"); router.refresh(); }
    catch (failure) { setError(friendlyError(failure)); } finally { setBusy(false); }
  }
  return <main id="main-content" className="form-page">
    <p className="eyebrow">Optional email verification</p><h1>One small check.</h1>
    <p>Request a six-digit code for your email. You can skip this step and use your account normally.</p>
    <button className="secondary-button" disabled={busy} onClick={send}>Send / resend code</button>
    <form className="panel-form" onSubmit={confirm}>
      <label>Verification code<input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required /></label>
      <button className="primary-button" disabled={busy}>Verify email</button>
    </form>
    {message && <p role="status">{message}</p>}{error && <p role="alert" className="form-error">{error}</p>}
    <p><Link href="/account">Skip for now / return to account</Link></p>
  </main>;
}
