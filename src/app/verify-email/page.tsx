"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { friendlyError } from "@/lib/api";
import { useApiMutation } from "@/lib/query/hooks";
import { otpSchema } from "@/lib/forms/schemas";
import { FormErrors } from "@/lib/forms/form-errors";

export default function VerifyEmailPage() {
  const router = useRouter();
  const form = useForm<{ code: string }>({ resolver: zodResolver(otpSchema), defaultValues: { code: "" } });
  const send = useApiMutation<unknown, void>(() => ({ path: "/api/account/verification/send", method: "POST", payload: {} }));
  const confirm = useApiMutation<unknown, { code: string }>(payload => ({ path: "/api/account/verification/confirm", method: "POST", payload }), ["/api/account/me"]);
  const busy = send.isPending || confirm.isPending;
  return <main id="main-content" className="form-page"><p className="eyebrow">Optional email verification</p><h1>One small check.</h1>
    <p>Request a six-digit code for your email. You can skip this step and use your account normally.</p>
    <button className="secondary-button" disabled={busy} onClick={() => send.mutate()}>Send / resend code</button>
    <form noValidate className="panel-form" onSubmit={form.handleSubmit(values => confirm.mutate(values, { onSuccess: () => { router.push("/account"); router.refresh(); } }))}>
      <label>Verification code<input {...form.register("code")} inputMode="numeric" autoComplete="one-time-code" aria-invalid={!!form.formState.errors.code} maxLength={6} /></label><FormErrors errors={form.formState.errors} />
      <button className="primary-button" disabled={busy}>Verify email</button>
    </form>
    {send.isSuccess && <p role="status">Delivery requested. Check your email; the code expires in 10 minutes. Wait 60 seconds before resending.</p>}
    {(send.error || confirm.error) && <p role="alert" className="form-error">{friendlyError(send.error ?? confirm.error)} You can skip verification.</p>}
    <p><Link href="/account">Skip for now / return to account</Link></p>
  </main>;
}
