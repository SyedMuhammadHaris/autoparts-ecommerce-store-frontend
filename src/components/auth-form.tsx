"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiRequest, friendlyError } from "@/lib/api";

export function AuthForm({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    const fields = new FormData(event.currentTarget);
    try {
      await apiRequest(`/api/auth/${register ? "register" : "login"}`, "POST", {
        name: fields.get("name"), email: fields.get("email"), password: fields.get("password"),
      });
      router.push(register ? "/verify-email" : "/account"); router.refresh();
    } catch (failure) { setError(friendlyError(failure)); } finally { setBusy(false); }
  }
  return <main id="main-content" className="form-page">
    <p className="eyebrow">Your Autoparts account</p>
    <h1>{register ? "Make yourself at home." : "Welcome back."}</h1>
    <p>{register ? "Create an account. Email verification is optional after signup." : "Sign in with your email and password."}</p>
    <form onSubmit={submit} className="panel-form">
      {register && <label>Name<input name="name" autoComplete="name" required maxLength={255} /></label>}
      <label>Email<input name="email" type="email" autoComplete="email" required maxLength={255} /></label>
      <label>Password<input name="password" type="password" autoComplete={register ? "new-password" : "current-password"} required minLength={register ? 8 : undefined} maxLength={128} /></label>
      {register && <small>Use at least 8 characters; avoid common, numeric-only, or personal passwords.</small>}
      {error && <p role="alert" className="form-error">{error}</p>}
      <button className="primary-button" disabled={busy}>{busy ? "Please wait…" : register ? "Create account" : "Sign in"}</button>
    </form>
    <p>{register ? "Already have an account? " : "New here? "}<Link href={register ? "/login" : "/signup"}>{register ? "Sign in" : "Create an account"}</Link></p>
  </main>;
}
