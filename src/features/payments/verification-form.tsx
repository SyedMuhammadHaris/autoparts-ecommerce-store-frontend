"use client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useApiMutation } from "@/lib/query/hooks";
import { FormErrors } from "@/lib/forms/form-errors";
import { friendlyError } from "@/lib/api";
import type { Submission } from "./types";

const schema = z.object({ decision: z.enum(["approve", "reject"]), note: z.string().trim().min(1, "Enter a customer-facing review note.").max(500) });
type Values = z.infer<typeof schema>;

export function VerificationForm({ orderId, submission }: { orderId: number; submission: Submission }) {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { decision: "reject", note: "" } });
  const save = useApiMutation<unknown, Values>(values => ({ path: "/api/admin/payments/{id}/verify", pathParams: { id: orderId }, method: "POST", payload: { ...values, submission: submission.id } }), ["/api/admin/payments"]);
  return <form className="panel-form" noValidate onSubmit={form.handleSubmit(values => save.mutate(values))}>
    <p>Reference: {submission.reference} · Receiving account: {submission.bank.account_number}</p>
    <label>Transfer decision<select {...form.register("decision")}><option value="reject">Reject</option><option value="approve">Approve after checking bank statement</option></select></label>
    <label>Customer-facing review note<textarea {...form.register("note")} maxLength={500} aria-invalid={!!form.formState.errors.note} /></label>
    <FormErrors errors={form.formState.errors} />
    {save.error && <p role="alert">{friendlyError(save.error)}</p>}
    <p>Approval confirms receipt of the full order amount and confirms the order. This decision cannot be edited.</p>
    <button className="primary-button" disabled={save.isPending}>Record transfer decision</button>
  </form>;
}
