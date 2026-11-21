"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useApiMutation } from "@/lib/query/hooks";
import { FormErrors } from "@/lib/forms/form-errors";
import { friendlyError } from "@/lib/api";

const schema = z.object({ decision: z.enum(["approved", "rejected"]), note: z.string().trim().min(1).max(1000) });
type Values = z.infer<typeof schema>;

export function ReturnReviewForm({ id }: { id: number }) {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { decision: "rejected", note: "" } });
  const save = useApiMutation<unknown, Values>(payload => ({ path: "/api/admin/returns/{id}", pathParams: { id }, method: "POST", payload: { ...payload, action: "review" } }), ["/api/admin/returns"]);
  return <form noValidate className="panel-form" onSubmit={form.handleSubmit(values => save.mutate(values))}>
    <label>Return decision<select {...form.register("decision")}><option value="rejected">Reject</option><option value="approved">Approve return</option></select></label>
    <label>Customer-facing decision note<textarea {...form.register("note")} maxLength={1000} /></label>
    <FormErrors errors={form.formState.errors} />{save.error && <p role="alert">{friendlyError(save.error)}</p>}
    <button className="primary-button" disabled={save.isPending}>Record return decision</button>
  </form>;
}
