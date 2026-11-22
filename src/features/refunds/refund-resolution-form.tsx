"use client";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useApiMutation } from "@/lib/query/hooks";
import { friendlyError } from "@/lib/api";
import { FormErrors } from "@/lib/forms/form-errors";

const schema = z.object({ action: z.enum(["complete", "cancel"]), note: z.string().trim().min(1).max(1000), reference: z.string().trim().max(120), acknowledged: z.boolean() }).superRefine((values, context) => {
  if (values.action === "complete") {
    if (!values.reference) context.addIssue({ code: "custom", path: ["reference"], message: "Enter the actual offline refund receipt reference." });
    if (!values.acknowledged) context.addIssue({ code: "custom", path: ["acknowledged"], message: "Confirm that the offline refund was paid and checked." });
  }
});
type Values = z.infer<typeof schema>;

export function RefundResolutionForm({ id }: { id: number }) {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { action: "cancel", note: "", reference: "", acknowledged: false } });
  const action = useWatch({ control: form.control, name: "action" });
  const save = useApiMutation<unknown, Values>(values => ({ path: "/api/admin/refunds/{id}", pathParams: { id }, method: "POST", payload: { action: values.action, note: values.note, reference: values.action === "complete" ? values.reference : "" } }), ["/api/admin/refunds"]);
  return <form noValidate className="panel-form" onSubmit={form.handleSubmit(values => save.mutate(values))}>
    <label>Refund resolution<select {...form.register("action")}><option value="cancel">Cancel unpaid authorization</option><option value="complete">Record completed offline refund</option></select></label>
    {action === "complete" && <><label>Offline refund receipt reference<input {...form.register("reference")} maxLength={120} /></label><label><input {...form.register("acknowledged")} type="checkbox" />I confirm the offline refund was paid and its receipt checked.</label></>}
    <label>Resolution note<textarea {...form.register("note")} maxLength={1000} /></label>
    <FormErrors errors={form.formState.errors} />{save.error && <p role="alert">{friendlyError(save.error)}</p>}
    <p>This records an offline decision. It does not send money. Completed records cannot be cancelled or edited.</p>
    <button className="primary-button" disabled={save.isPending}>Record refund resolution</button>
  </form>;
}
