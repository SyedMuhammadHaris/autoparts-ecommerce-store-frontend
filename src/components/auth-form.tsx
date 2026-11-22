"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useRef, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiAction, friendlyError } from "@/lib/api";
import { authSchema, type AuthValues } from "@/lib/forms/schemas";
import { errorAttributes, FormErrors } from "@/lib/forms/form-errors";
import { authStateChanged } from "@/lib/query/provider";
import { ApiError } from "@/lib/api/contracts";
import { notifyError, notifySuccess } from "@/lib/notifications";

export function AuthForm({ register: signup = false }: { register?: boolean }) {
  const router = useRouter();
  const client = useQueryClient();
  const form = useForm<AuthValues>({ resolver: zodResolver(authSchema(signup)), defaultValues: { name: "", email: "", password: "" } });
  const submission = useRef<{ values: AuthValues | null; pending: boolean }>({ values: null, pending: false });
  const mutation = useMutation({ retry: false, gcTime: 0, mutationFn: async () => {
    // Credentials stay in the form and this call, never in mutation-cache variables.
    const values = submission.current.values;
    submission.current.values = null;
    if (!values) throw new Error("Invalid form submission");
    if (signup) await apiAction({ path: "/api/account/register", method: "POST", payload: values, notifications: { success: false } });
    const result = await signIn("credentials", { email: values.email, password: values.password, redirect: false });
    if (!result?.ok || result.error) throw new Error("Invalid sign-in");
    await client.cancelQueries();
    client.removeQueries({ type: "inactive" });
    await client.resetQueries({ type: "active" });
    await apiAction({ path: "/api/cart/merge", method: "POST", payload: {}, notifications: { success: false } });
    router.push(signup ? "/verify-email" : "/account"); router.refresh(); authStateChanged();
    notifySuccess(signup ? "Account created. Email verification is optional." : "Signed in.");
  }, onError: failure => {
    if (!(failure instanceof ApiError)) notifyError(failure, failure.message === "Invalid sign-in" ? "Unable to sign in. Check your email and password." : undefined);
  }, onSettled: () => { submission.current = { values: null, pending: false }; } });
  const error = mutation.error?.message === "Invalid sign-in" ? "Unable to sign in. Check your email/password, or try signing in if your account was just created." : mutation.error ? friendlyError(mutation.error) : "";
  function submit(event: FormEvent<HTMLFormElement>) {
    void form.handleSubmit(values => {
      if (submission.current.pending) return;
      submission.current = { values, pending: true }; mutation.mutate();
    })(event);
  }
  return <main id="main-content" className="form-page">
    <p className="eyebrow">Your Autoparts account</p><h1>{signup ? "Make yourself at home." : "Welcome back."}</h1>
    <p>{signup ? "Create an account. Email verification is optional after signup." : "Sign in with your email and password."}</p>
    <form noValidate onSubmit={submit} className="panel-form">
      {signup && <label>Name<input {...form.register("name")} autoComplete="name" {...errorAttributes(form.formState.errors, "name", "auth")} maxLength={255} /></label>}
      <label>Email<input {...form.register("email")} type="email" autoComplete="email" {...errorAttributes(form.formState.errors, "email", "auth")} maxLength={255} /></label>
      <label>Password<input {...form.register("password")} type="password" autoComplete={signup ? "new-password" : "current-password"} {...errorAttributes(form.formState.errors, "password", "auth")} maxLength={128} /></label>
      {signup && <small>Use at least 8 characters; avoid common, numeric-only, or personal passwords.</small>}
      <FormErrors errors={form.formState.errors} idPrefix="auth" />
      {error && <p role="alert" className="form-error">{error}</p>}
      <button className="primary-button" disabled={mutation.isPending}>{mutation.isPending ? "Please wait…" : signup ? "Create account" : "Sign in"}</button>
    </form>
    <p>{signup ? "Already have an account? " : "New here? "}<Link href={signup ? "/login" : "/signup"}>{signup ? "Sign in" : "Create an account"}</Link></p>
  </main>;
}
