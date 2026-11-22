"use client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useApiMutation } from "@/lib/query/hooks";
import { FormErrors } from "@/lib/forms/form-errors";
import { friendlyError } from "@/lib/api";

const schema = z.object({ reference: z.string().trim().min(1).max(120), amount: z.string().regex(/^\d{1,16}(\.\d{1,2})?$/, "Enter the collected amount in PKR.") });
type Values = z.infer<typeof schema>;

export function CollectionForm({ orderId }: { orderId: number }) {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { reference: "", amount: "" } });
  const save = useApiMutation<unknown, Values>(payload => ({ path: "/api/admin/payments/{id}/collect-cod", pathParams: { id: orderId }, method: "POST", payload }), ["/api/admin/payments"]);
  return <form className="panel-form" noValidate onSubmit={form.handleSubmit(values => save.mutate(values))}>
    <label>Collection receipt reference<input {...form.register("reference")} maxLength={120} /></label>
    <label>Amount actually collected (PKR)<input {...form.register("amount")} inputMode="decimal" /></label>
    <FormErrors errors={form.formState.errors} />
    {save.error && <p role="alert">{friendlyError(save.error)}</p>}
    <button className="primary-button" disabled={save.isPending}>Record COD collection</button>
  </form>;
}
