"use client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useApiMutation } from "@/lib/query/hooks";
import { friendlyError } from "@/lib/api";
import { FormErrors } from "@/lib/forms/form-errors";

const schema = z.object({ carrier: z.string().trim().max(120), tracking_reference: z.string().trim().max(120) });
type Values = z.infer<typeof schema>;

export function FulfillmentForm({ id, target }: { id: number; target: string }) {
  const form = useForm<Values>({ resolver: zodResolver(schema.superRefine((value, context) => {
    if (target === "shipped") for (const field of ["carrier", "tracking_reference"] as const) if (!value[field]) context.addIssue({ code: "custom", path: [field], message: "Required for shipment." });
  })), defaultValues: { carrier: "", tracking_reference: "" } });
  const update = useApiMutation<unknown, Values>(payload => ({ path: "/api/admin/fulfillment/{id}", pathParams: { id }, method: "POST", payload: { ...payload, target } }), ["/api/admin/fulfillment", "/api/admin/payments"]);
  return <form className="panel-form" noValidate onSubmit={form.handleSubmit(values => update.mutate(values))}>
    {target === "shipped" && <><label>Carrier name<input {...form.register("carrier")} maxLength={120} /></label><label>Tracking reference<input {...form.register("tracking_reference")} maxLength={120} /></label><p>Shipping consumes the reserved stock and records this shipment. Check these details before submitting.</p></>}
    <FormErrors errors={form.formState.errors} />
    {update.error && <p role="alert">{friendlyError(update.error)}</p>}
    <button className="primary-button" disabled={update.isPending}>Mark {target}</button>
  </form>;
}
