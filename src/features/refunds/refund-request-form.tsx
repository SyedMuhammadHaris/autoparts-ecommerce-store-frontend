"use client";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useApiMutation } from "@/lib/query/hooks";
import { friendlyError } from "@/lib/api";
import { FormErrors } from "@/lib/forms/form-errors";

const schema = z.object({ return_request: z.string().regex(/^[1-9][0-9]*$/, "Enter the inspected return request number."), amount: z.string().regex(/^\d{1,16}(\.\d{1,2})?$/, "Enter an amount in PKR.").refine(value => /[1-9]/.test(value), "Refund must be greater than zero."), reason: z.string().trim().min(1).max(1000) });
type Values = z.infer<typeof schema>;

export function RefundRequestForm() {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { return_request: "", amount: "", reason: "" } });
  const attempt = useRef({ body: "", key: "" });
  const save = useApiMutation<unknown, Values>(values => {
    const payload = { ...values, return_request: Number(values.return_request) };
    const body = JSON.stringify(payload);
    if (body !== attempt.current.body) attempt.current = { body, key: crypto.randomUUID() };
    return { path: "/api/admin/refunds", method: "POST", payload: { ...payload, idempotency_key: attempt.current.key } };
  }, ["/api/admin/refunds"]);
  return <form noValidate className="panel-form" onSubmit={form.handleSubmit(values => save.mutate(values))}>
    <h2>Authorize manual refund</h2>
    <label>Inspected return request number<input {...form.register("return_request")} inputMode="numeric" /></label>
    <label>Refund amount (PKR)<input {...form.register("amount")} inputMode="decimal" /></label>
    <label>Reason and policy basis<textarea {...form.register("reason")} maxLength={1000} /></label>
    <FormErrors errors={form.formState.errors} />{save.error && <p role="alert">{friendlyError(save.error)} Retry the same request or refresh the ledger before creating another authorization.</p>}
    <p>Check the return policy and the actual amount received. Pending plus completed refunds cannot exceed the amount paid. Authorization sends no money.</p>
    {save.isSuccess && <p role="status">Authorization recorded. Review the refund ledger before arranging any offline payment.</p>}
    <button className="primary-button" disabled={save.isPending || save.isSuccess}>Authorize refund (no payout)</button>
    {save.isSuccess && <button type="button" onClick={() => { save.reset(); form.reset(); attempt.current = { body: "", key: "" }; }}>New refund authorization</button>}
  </form>;
}
